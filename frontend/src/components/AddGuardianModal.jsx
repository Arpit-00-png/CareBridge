import { useState } from 'react';
import api from '../api/axios';

const AddGuardianModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relation: 'parent'
  });
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/patient/add-guardian', formData);
      if (res.data.tempPassword) {
        setTempPassword(res.data.tempPassword);
        alert(`✅ Guardian added! Temporary password: ${res.data.tempPassword}\nPlease share this with the guardian.`);
      } else {
        alert('✅ Guardian added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || '❌ Failed to add guardian');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">👨‍👩‍👦 Add Guardian</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Relation</label>
            <select
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="child">Child</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Guardian'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGuardianModal;