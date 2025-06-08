'use client';

import { useEffect } from 'react';
import useUserStore from '../../../store/userStore';

function VoiceNameManager() {
  const {
    users,
    availableVoiceNames,
    isLoading,
    error,
    assignmentStatus,
    fetchUsers,
    fetchVoiceNames,
    assignVoiceName,
    clearAssignmentStatus
  } = useUserStore();

  useEffect(() => {
    fetchUsers();
    fetchVoiceNames();
  }, []);

  useEffect(() => {
    if (assignmentStatus) {
      const timer = setTimeout(clearAssignmentStatus, 3000);
      return () => clearTimeout(timer);
    }
  }, [assignmentStatus]);

  const handleVoiceNameChange = async (userId, voiceName) => {
    await assignVoiceName(userId, voiceName);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Voice Name Management</h2>

      {assignmentStatus === 'success' && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Voice name successfully assigned!
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Voice Name
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={user.voiceName || ''}
                    onChange={(e) => handleVoiceNameChange(user.id, e.target.value)}
                    disabled={user.role === 'MANAGER' || user.role === 'OPERATIONS'}
                  >
                    <option value="">Select Voice Name</option>
                    {availableVoiceNames.map(name => (
                      <option
                        key={name}
                        value={name}
                        disabled={users.some(u => u.voiceName === name && u.id !== user.id)}
                      >
                        {name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VoiceNameManager;
