export function validateBucketFields(formData) {
  const errors = {};
  if (!formData.access_key_id || !formData.access_key_id.trim()) errors.access_key_id = 'Access Key ID is required';
  if (!formData.secret_access_key || !formData.secret_access_key.trim()) errors.secret_access_key = 'Secret Access Key is required';
  if (!formData.bucket || !formData.bucket.trim()) errors.bucket = 'Bucket name is required';
  if (!formData.region || !formData.region.trim()) errors.region = 'Region is required';
  return errors;
}