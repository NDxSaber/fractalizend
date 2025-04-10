import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import styles from './VibrationalDates.module.css';

interface VibrationalDate extends DocumentData {
  id?: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  name: string;
  description: string;
}

export default function VibrationalDates() {
  const [dates, setDates] = useState<VibrationalDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<VibrationalDate | null>(null);
  const [formData, setFormData] = useState<VibrationalDate>({
    fromDate: '',
    fromTime: '',
    toDate: '',
    toTime: '',
    name: '',
    description: ''
  });

  // Fetch vibrational dates
  useEffect(() => {
    setLoading(true);
    
    const datesQuery = query(collection(db, 'vibrationalDates'));
    
    const unsubscribe = onSnapshot(
      datesQuery,
      (snapshot) => {
        const datesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VibrationalDate[];
        
        // Sort dates chronologically by fromDate and fromTime
        datesData.sort((a, b) => {
          const dateA = new Date(`${a.fromDate}T${a.fromTime}`);
          const dateB = new Date(`${b.fromDate}T${b.fromTime}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        setDates(datesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching vibrational dates:', err);
        setError('Error fetching vibrational dates');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date and time range
    const fromDateTime = new Date(`${formData.fromDate}T${formData.fromTime}`);
    const toDateTime = new Date(`${formData.toDate}T${formData.toTime}`);
    
    if (fromDateTime > toDateTime) {
      setError('From date/time cannot be after to date/time');
      return;
    }
    
    try {
      if (editingDate) {
        // Update existing date
        await updateDoc(doc(db, 'vibrationalDates', editingDate.id!), formData);
      } else {
        // Add new date
        await addDoc(collection(db, 'vibrationalDates'), formData);
      }
      
      // Reset form
      setFormData({
        fromDate: '',
        fromTime: '',
        toDate: '',
        toTime: '',
        name: '',
        description: ''
      });
      setEditingDate(null);
      setError(null);
    } catch (err) {
      console.error('Error saving vibrational date:', err);
      setError('Error saving vibrational date');
    }
  };

  const handleEdit = (date: VibrationalDate) => {
    setEditingDate(date);
    setFormData(date);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this date?')) {
      try {
        await deleteDoc(doc(db, 'vibrationalDates', id));
      } catch (err) {
        console.error('Error deleting vibrational date:', err);
        setError('Error deleting vibrational date');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading vibrational dates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Vibrational Dates</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.dateTimeGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="fromDate">From Date:</label>
            <input
              type="date"
              id="fromDate"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="fromTime">From Time:</label>
            <input
              type="time"
              id="fromTime"
              name="fromTime"
              value={formData.fromTime}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className={styles.dateTimeGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="toDate">To Date:</label>
            <input
              type="date"
              id="toDate"
              name="toDate"
              value={formData.toDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="toTime">To Time:</label>
            <input
              type="time"
              id="toTime"
              name="toTime"
              value={formData.toTime}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <button type="submit" className={styles.submitButton}>
          {editingDate ? 'Update Date' : 'Add Date'}
        </button>
        
        {editingDate && (
          <button
            type="button"
            onClick={() => {
              setEditingDate(null);
              setFormData({
                fromDate: '',
                fromTime: '',
                toDate: '',
                toTime: '',
                name: '',
                description: ''
              });
              setError(null);
            }}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        )}
      </form>
      
      <div className={styles.datesList}>
        {dates.map(date => (
          <div key={date.id} className={styles.dateCard}>
            <div className={styles.dateHeader}>
              <h3>{date.name}</h3>
              <div className={styles.dateActions}>
                <button
                  onClick={() => handleEdit(date)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(date.id!)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
            <p className={styles.date}>
              {new Date(`${date.fromDate}T${date.fromTime}`).toLocaleString()} - {new Date(`${date.toDate}T${date.toTime}`).toLocaleString()}
            </p>
            <p className={styles.description}>{date.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 