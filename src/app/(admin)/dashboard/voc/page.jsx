// pages/admin/dashboard.js
import { useUser } from '@clerk/nextjs';
import SurveyUpload from '../../components/admin/SurveyUpload';

function SurveyUploadPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">VOC Upload</h1>
      <SurveyUpload />
    </div>
  );
}

export default SurveyUploadPage;