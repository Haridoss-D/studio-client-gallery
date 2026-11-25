// Temporary page used for admin screens we build in later steps.
export default function AdminPlaceholder({ title }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      <div className="empty">
        <p>This page is built in a later step.</p>
      </div>
    </>
  );
}
