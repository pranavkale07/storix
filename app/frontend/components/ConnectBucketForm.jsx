import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { validateBucketFields } from '../lib/validateBucketFields';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ConnectBucketForm({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  editing = false,
}) {
  const [formData, setFormData] = useState({
    provider: 's3',
    bucket: '',
    access_key_id: '',
    secret_access_key: '',
    region: '',
    endpoint: '',
    ...initialValues,
  });
  const [formErrors, setFormErrors] = useState(errors);

  useEffect(() => {
    setFormErrors(errors);
  }, [errors]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = validateBucketFields(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errors.error}</AlertDescription>
        </Alert>
      )}
      {/* Stack all fields vertically */}
        <div className="w-full">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={formData.provider}
            onValueChange={value => handleInputChange('provider', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s3">AWS S3</SelectItem>
              <SelectItem value="digitalocean">DigitalOcean Spaces</SelectItem>
              <SelectItem value="custom">Custom S3-Compatible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <Label htmlFor="bucket">Bucket Name</Label>
          <Input
            id="bucket"
            value={formData.bucket}
            onChange={e => handleInputChange('bucket', e.target.value)}
            placeholder="my-bucket-name"
            className={formErrors.bucket ? 'border-destructive' : ''}
          />
          {formErrors.bucket && (
            <p className="text-sm text-destructive mt-1">{formErrors.bucket}</p>
          )}
        </div>
        <div className="w-full">
          <Label htmlFor="access_key_id">Access Key ID</Label>
          <Input
            id="access_key_id"
            value={formData.access_key_id}
            onChange={e => handleInputChange('access_key_id', e.target.value)}
            placeholder="AKIA..."
            className={formErrors.access_key_id ? 'border-destructive' : ''}
          />
          {formErrors.access_key_id && (
            <p className="text-sm text-destructive mt-1">{formErrors.access_key_id}</p>
          )}
        </div>
        <div className="w-full">
          <Label htmlFor="secret_access_key">Secret Access Key</Label>
          <Input
            id="secret_access_key"
            type="password"
            value={formData.secret_access_key}
            onChange={e => handleInputChange('secret_access_key', e.target.value)}
            placeholder="••••••••"
            className={formErrors.secret_access_key ? 'border-destructive' : ''}
          />
          {formErrors.secret_access_key && (
            <p className="text-sm text-destructive mt-1">{formErrors.secret_access_key}</p>
          )}
        </div>
        <div className="w-full">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={e => handleInputChange('region', e.target.value)}
            placeholder="e.g., us-east-1, eu-west-1, ap-southeast-1"
            className={formErrors.region ? 'border-destructive' : ''}
          />
          {formErrors.region && (
            <p className="text-sm text-destructive mt-1">{formErrors.region}</p>
          )}
        </div>
        {(formData.provider === 'digitalocean' || formData.provider === 'custom') && (
          <div className="w-full">
            <Label htmlFor="endpoint">Endpoint (Optional)</Label>
            <Input
              id="endpoint"
              value={formData.endpoint}
              onChange={e => handleInputChange('endpoint', e.target.value)}
              placeholder="https://nyc3.digitaloceanspaces.com"
            />
          </div>
        )}
      {/* End of fields */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {editing ? 'Saving...' : 'Connecting...'}
            </>
          ) : (
            <>
              {editing ? 'Save' : 'Connect'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
} 