export async function fetchServiceTypes() {
  const response = await fetch('/api/service-type?simple=true');
  if (!response.ok) {
    throw new Error('Failed to fetch service types');
  }
  return response.json();
}