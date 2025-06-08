import { useEffect } from 'react';
import useSurveyStore from '../store/surveyStore';

function SurveyList() {
  const { surveys, isLoading, error, fetchSurveys } = useSurveyStore();

  useEffect(() => {
    fetchSurveys();
  }, []);

  if (isLoading) return <div>Loading surveys...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Survey List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Voice Name</th>
              <th className="px-4 py-2">AHT</th>
              <th className="px-4 py-2">CSAT</th>
              <th className="px-4 py-2">Comment</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map(survey => (
              <tr key={survey.id} className="border-b">
                <td className="px-4 py-2">{new Date(survey.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{survey.voiceName}</td>
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

export default SurveyList;
