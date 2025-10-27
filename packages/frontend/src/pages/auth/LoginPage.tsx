import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { branding } = useBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <div className="text-center mb-4">
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt={branding.organizationName}
                  style={{ maxHeight: '80px' }}
                  className="mb-3"
                />
              )}
              <h2 className="fw-bold" style={{ color: 'var(--primary-color)' }}>
                {branding.organizationName}
              </h2>
              <p className="text-muted">Disaster Recovery Assessment Tool</p>
            </div>

            <Card className="shadow">
              <Card.Body className="p-4">
                <h4 className="text-center mb-4">Sign In</h4>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Form>

                <hr className="my-4" />

                <p className="text-center mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Sign up
                  </Link>
                </p>
              </Card.Body>
            </Card>

            {branding.contactEmail && (
              <p className="text-center text-muted mt-3">
                <small>
                  Need help? Contact{' '}
                  <a href={`mailto:${branding.contactEmail}`}>{branding.contactEmail}</a>
                </small>
              </p>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
