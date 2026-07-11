import { useState } from 'react';
import api from '../api/axios';

const PrescriptionModal = ({ relationId, onClose, onSuccess }) => {
  const [medicines, setMedicines] = useState([
    {
      medicineName: '',
      dosage: '',
      duration: '',
      foodRelation: 'ANYTIME',
      timings: ['09:00']
    }
  ]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  // Add time to a medicine
  const addTime = (medIndex) => {
    const updated = [...medicines];
    updated[medIndex].timings.push('09:00');
    setMedicines(updated);
  };

  // Remove time from a medicine
  const removeTime = (medIndex, timeIndex) => {
    const updated = [...medicines];
    updated[medIndex].timings.splice(timeIndex, 1);
    setMedicines(updated);
  };

  // Update time value
  const updateTime = (medIndex, timeIndex, value) => {
    const updated = [...medicines];
    updated[medIndex].timings[timeIndex] = value;
    setMedicines(updated);
  };

  // Update medicine field
  const updateMedicine = (medIndex, field, value) => {
    const updated = [...medicines];
    updated[medIndex][field] = value;
    setMedicines(updated);
  };

  // Add new medicine
  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: '',
        dosage: '',
        duration: '',
        foodRelation: 'ANYTIME',
        timings: ['09:00']
      }
    ]);
  };

  // Remove medicine
  const removeMedicine = (medIndex) => {
    if (medicines.length === 1) return;
    const updated = medicines.filter((_, i) => i !== medIndex);
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    for (let med of medicines) {
      if (!med.medicineName || !med.dosage || !med.duration) {
        alert('Please fill all medicine fields');
        return;
      }
      if (med.timings.length === 0) {
        alert(`Please add at least one timing for ${med.medicineName}`);
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/medical/prescription', {
        relationId,
        instructions,
        medicines: medicines.map(med => ({
          medicineName: med.medicineName,
          dosage: med.dosage,
          duration: parseInt(med.duration),
          foodRelation: med.foodRelation,
          timings: med.timings
        }))
      });
      onSuccess('✅ Prescription created successfully!');
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || '❌ Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📋 New Prescription</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medicines */}
          {medicines.map((med, medIndex) => (
            <div key={medIndex} className="border border-gray-200 rounded-lg p-4 relative">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Medicine #{medIndex + 1}</h3>
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(medIndex)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicine Name *</label>
                  <input
                    type="text"
                    value={med.medicineName}
                    onChange={(e) => updateMedicine(medIndex, 'medicineName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="e.g., Paracetamol"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosage *</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedicine(medIndex, 'dosage', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="e.g., 650 mg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (Days) *</label>
                  <input
                    type="number"
                    value={med.duration}
                    onChange={(e) => updateMedicine(medIndex, 'duration', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="e.g., 5"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Food Relation</label>
                  <select
                    value={med.foodRelation}
                    onChange={(e) => updateMedicine(medIndex, 'foodRelation', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="BEFORE_FOOD">Before Food</option>
                    <option value="AFTER_FOOD">After Food</option>
                    <option value="ANYTIME">Anytime</option>
                  </select>
                </div>
              </div>

              {/* Timings */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Timings *</label>
                <div className="space-y-2">
                  {med.timings.map((time, timeIndex) => (
                    <div key={timeIndex} className="flex gap-2 items-center">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(medIndex, timeIndex, e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-40"
                        required
                      />
                      {med.timings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTime(medIndex, timeIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addTime(medIndex)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Time
                </button>
              </div>
            </div>
          ))}

          {/* Add Medicine Button */}
          <button
            type="button"
            onClick={addMedicine}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition"
          >
            + Add Another Medicine
          </button>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Common Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 h-20"
              placeholder="Additional instructions for the patient..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Prescription'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-2.5 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionModal;