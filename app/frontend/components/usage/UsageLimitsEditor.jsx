import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertTriangle, Save, Loader2, Edit } from 'lucide-react';
import { useUsage } from '../UsageContext';
import { showToast } from '../utils/toast';
import { apiFetch } from '../../lib/api';

export function UsageLimitsEditor({ credentialId, onSave }) {
  const { updateBucketLimits, loading, error } = useUsage();
  const [formData, setFormData] = useState({
    write_requests_per_month: '',
    read_requests_per_month: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loadingLimits, setLoadingLimits] = useState(false);

  // Load current limits when component mounts
  useEffect(() => {
    if (credentialId) {
      // Fetch current limits from the API
      const fetchLimits = async () => {
        setLoadingLimits(true);
        try {
          const response = await apiFetch(`/api/bucket_usage/${encodeURIComponent(credentialId)}/limits`);
          if (response.ok) {
            const data = await response.json();
            setFormData({
              write_requests_per_month: data.limits?.write_requests_per_month?.toString() || '',
              read_requests_per_month: data.limits?.read_requests_per_month?.toString() || '',
            });
          } else {
            // Fallback to empty values if API fails
            setFormData({
              write_requests_per_month: '',
              read_requests_per_month: '',
            });
          }
        } catch (error) {
          console.error('Failed to fetch limits:', error);
          // Fallback to empty values
          setFormData({
            write_requests_per_month: '',
            read_requests_per_month: '',
          });
        } finally {
          setLoadingLimits(false);
        }
      };

      fetchLimits();
    }
  }, [credentialId]);

  const validateForm = () => {
    const errors = {};

    // Validate write requests limit (optional - can be empty for unlimited)
    if (formData.write_requests_per_month.trim()) {
      const writeLimit = parseInt(formData.write_requests_per_month);
      if (isNaN(writeLimit) || writeLimit <= 0) {
        errors.write_requests_per_month = 'Write requests limit must be a positive number';
      } else if (writeLimit > 2147483647) {
        errors.write_requests_per_month = 'Write requests limit cannot exceed 2,147,483,647';
      }
    }

    // Validate read requests limit (optional - can be empty for unlimited)
    if (formData.read_requests_per_month.trim()) {
      const readLimit = parseInt(formData.read_requests_per_month);
      if (isNaN(readLimit) || readLimit <= 0) {
        errors.read_requests_per_month = 'Read requests limit must be a positive number';
      } else if (readLimit > 2147483647) {
        errors.read_requests_per_month = 'Read requests limit cannot exceed 2,147,483,647';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const limits = {
        write_requests_per_month: formData.write_requests_per_month.trim() || null,
        read_requests_per_month: formData.read_requests_per_month.trim() || null,
      };

      await updateBucketLimits(credentialId, limits);

      showToast.success('Bucket limits updated successfully');
      setIsEditing(false);

      if (onSave) {
        onSave(limits);
      }
    } catch (err) {
      showToast.error('Failed to update bucket limits', err.message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValidationErrors({});
    // Reset form to empty values (unlimited)
    setFormData({
      write_requests_per_month: '',
      read_requests_per_month: '',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  if (!credentialId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No credential selected for editing limits.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Usage Limits</span>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Limits
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isEditing ? (
          // Display current limits in a clean format
          <div className="space-y-4">
            {loadingLimits ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading limits...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Write Requests</span>
                      <span className="text-xs text-muted-foreground">Tier 1</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formData.write_requests_per_month ? formData.write_requests_per_month : 'Unlimited'}
                    </div>
                    <p className="text-xs text-muted-foreground">PUT, COPY, POST, LIST operations</p>
                  </div>

                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Read Requests</span>
                      <span className="text-xs text-muted-foreground">Tier 2</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formData.read_requests_per_month ? formData.read_requests_per_month : 'Unlimited'}
                    </div>
                    <p className="text-xs text-muted-foreground">GET and other operations</p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Total Monthly Limit:</strong> {
                      (formData.write_requests_per_month && formData.read_requests_per_month)
                        ? (parseInt(formData.write_requests_per_month) + parseInt(formData.read_requests_per_month)).toLocaleString() + ' requests'
                        : 'Unlimited'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          // Edit form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="write_requests_per_month">
                  Write Requests per Month
                </Label>
                <Input
                  id="write_requests_per_month"
                  type="text"
                  placeholder="Leave empty for unlimited"
                  value={formData.write_requests_per_month}
                  onChange={(e) => handleInputChange('write_requests_per_month', e.target.value)}
                  disabled={loading}
                  className={validationErrors.write_requests_per_month ? 'border-destructive' : ''}
                />
                {validationErrors.write_requests_per_month && (
                  <p className="text-sm text-destructive">
                    {validationErrors.write_requests_per_month}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  PUT, COPY, POST, LIST operations (Tier 1). Leave empty for unlimited.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="read_requests_per_month">
                  Read Requests per Month
                </Label>
                <Input
                  id="read_requests_per_month"
                  type="text"
                  placeholder="Leave empty for unlimited"
                  value={formData.read_requests_per_month}
                  onChange={(e) => handleInputChange('read_requests_per_month', e.target.value)}
                  disabled={loading}
                  className={validationErrors.read_requests_per_month ? 'border-destructive' : ''}
                />
                {validationErrors.read_requests_per_month && (
                  <p className="text-sm text-destructive">
                    {validationErrors.read_requests_per_month}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  GET and other operations (Tier 2). Leave empty for unlimited.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}