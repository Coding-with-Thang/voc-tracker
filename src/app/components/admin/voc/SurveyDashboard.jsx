import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import useSurveyStore from '../store/surveyStore';

function SurveyDashboard() {
  const { user } = useUser();
  const {
    surveys,
    isLoading,
    error,
    fetchSurveys,
    setUserRole,
    getVisibleSurveys
  } = useSurveyStore();

  useEffect(() => {
    // Set user role in store when component mounts
    if (user?.publicMetadata?.role) {
      setUserRole(user.publicMetadata.role);
    }
    fetchSurveys();
  }, [user]);

  const visibleSurveys = getVisibleSurveys(user);

  if (isLoading) return <div>Loading surveys...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {user?.publicMetadata?.role === 'AGENT'
            ? 'My VOC Data'
            : 'All VOC Data'}
        </h2>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h3>Average CSAT</h3>
          <p className="text-xl font-bold">
            {(visibleSurveys.reduce((acc, survey) => acc + survey.CSAT, 0) / visibleSurveys.length).toFixed(2)}
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3>Total Surveys</h3>
          <p className="text-xl font-bold">{visibleSurveys.length}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3>Average AHT</h3>
          <p className="text-xl font-bold">
            {calculateAverageAHT(visibleSurveys)}
          </p>
        </div>
      </div>

      {/* Survey Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Date</th>
              {(user?.publicMetadata?.role === 'MANAGER' ||
                user?.publicMetadata?.role === 'OPERATIONS') && (
                  <th className="px-4 py-2">Agent</th>
                )}
              <th className="px-4 py-2">AHT</th>
              <th className="px-4 py-2">CSAT</th>
              <th className="px-4 py-2">Comment</th>
            </tr>
          </thead>
          <tbody>
            {visibleSurveys.map(survey => (
              <tr key={survey.id} className="border-b">
                <td className="px-4 py-2">
                  {new Date(survey.date).toLocaleDateString()}
                </td>
                {(user?.publicMetadata?.role === 'MANAGER' ||
                  user?.publicMetadata?.role === 'OPERATIONS') && (
                    <td className="px-4 py-2">
                      {`${survey.user.firstName} ${survey.user.lastName}`}
                    </td>
                  )}
                <td className="px-4 py-2">{survey.AHT}</td>
                <td className="px-4 py-2">{survey.CSAT}</td>
                <td className="px-4 py-2">{survey.comment || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to calculate average AHT
function calculateAverageAHT(surveys) {
  if (!surveys.length) return '0:00';

  const times = surveys.map(s => {
    const [minutes, seconds] = s.AHT.split(':').map(Number);
    return minutes * 60 + seconds;
  });

  const avgSeconds = times.reduce((acc, time) => acc + time, 0) / times.length;
  const minutes = Math.floor(avgSeconds / 60);
  const seconds = Math.round(avgSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default SurveyDashboard;
