import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'

const TICKETS_COLLECTION = 'parkingTickets'

export const ticketService = {
  // Add a new parking ticket
  async addTicket(userId, ticketData) {
    try {
      const docRef = await addDoc(collection(db, TICKETS_COLLECTION), {
        userId,
        title: ticketData.title,
        notes: ticketData.notes || '',
        location: ticketData.location, // GeoPoint or coordinate array
        paid: ticketData.paid || false,
        photoUrl: ticketData.photoUrl || '',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding ticket:', error)
      throw error
    }
  },

  // Get all tickets for a user
  async getUserTickets(userId) {
    try {
      const q = query(
        collection(db, TICKETS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const tickets = []
      querySnapshot.forEach((doc) => {
        tickets.push({
          id: doc.id,
          ...doc.data()
        })
      })
      return tickets
    } catch (error) {
      console.error('Error fetching tickets:', error)
      throw error
    }
  },

  // Update a ticket (mark as paid, update notes, etc.)
  async updateTicket(ticketId, updates) {
    try {
      const ticketRef = doc(db, TICKETS_COLLECTION, ticketId)
      await updateDoc(ticketRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating ticket:', error)
      throw error
    }
  },

  // Delete a ticket
  async deleteTicket(ticketId) {
    try {
      await deleteDoc(doc(db, TICKETS_COLLECTION, ticketId))
    } catch (error) {
      console.error('Error deleting ticket:', error)
      throw error
    }
  },

  // Mark ticket as paid/unpaid
  async toggleTicketPaid(ticketId, paid) {
    return this.updateTicket(ticketId, { paid })
  }
}