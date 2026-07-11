import { useState } from 'react';
import api from '../api/axios';

const AppointmentModal = ({ relationId, onClose, onSuccess }) => {
    const [scheduledTime, setScheduledTime] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!scheduledTime) {
            alert('Please select a date and time');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/medical/appointment', {
                relationId,
                scheduledTime
            });
            onSuccess('✅ Appointment scheduled successfully!');
            const callLink = res.data.callLink;
            alert(`✅ Appointment scheduled! Call link: ${window.location.origin}/call/${res.data.appointment.roomId}`);
            onClose();
        } catch (error) {
            alert(error.response?.data?.error || '❌ Failed to schedule appointment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">📅 Schedule Appointment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date & Time *
                        </label>
                        <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2"
                            required
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? 'Scheduling...' : 'Schedule'}
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

export default AppointmentModal;