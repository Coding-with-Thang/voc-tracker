import VoiceNameManager from '../../../components/admin/users/VoiceNameManager';

function UsersDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="space-y-8">
        <VoiceNameManager />
      </div>
    </div>
  );
}

export default UsersDashboardPage;
