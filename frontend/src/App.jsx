import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import Galleries from "./pages/Galleries";
import GalleryForm from "./pages/GalleryForm";
import GalleryDetails from "./pages/GalleryDetails";
import Clients from "./pages/Clients";
import UploadPhotos from "./pages/UploadPhotos";
import ClientGallery from "./pages/ClientGallery";
import SelectedPhotos from "./pages/SelectedPhotos";
import SelectedGallery from "./pages/SelectedGallery";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/gallery/:token" element={<ClientGallery />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="galleries" element={<Galleries />} />
        <Route path="galleries/new" element={<GalleryForm />} />
        <Route path="galleries/:id" element={<GalleryDetails />} />
        <Route path="galleries/:id/edit" element={<GalleryForm />} />
        <Route path="upload" element={<UploadPhotos />} />
        <Route path="clients" element={<Clients />} />
        <Route path="selected" element={<SelectedPhotos />} />
        <Route path="selected/:id" element={<SelectedGallery />} />
        <Route path="settings" element={<AdminPlaceholder title="Settings" />} />
      </Route>
    </Routes>
  );
}
