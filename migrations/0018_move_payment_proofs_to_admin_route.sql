-- Payment proofs are now served via the Cloudflare Access protected admin route.
-- Rewrite existing URLs stored in CourseEnrollment.
UPDATE CourseEnrollment
SET paymentProofUrl = REPLACE(paymentProofUrl, '/api/files/payments/', '/api/admin/files/payments/')
WHERE paymentProofUrl LIKE '/api/files/payments/%';
