import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Layout } from '../../components/Layout';
import { api, handleApiError } from '../../lib/api';

const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'HYBRID'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/assessments', formData);
      const assessmentId = response.data.data.id;
      navigate(`/assessments/${assessmentId}`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            <h1 className="mb-4">Create New Assessment</h1>

            <Card className="shadow-sm">
              <Card.Body className="p-4">
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Assessment Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Q1 2025 DR Assessment"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Add notes about this assessment..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Assessment Type</Form.Label>
                    <Form.Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="HIGH_LEVEL">High-Level (Questionnaire Only)</option>
                      <option value="DEEP_DIVE">Deep-Dive (Infrastructure Mapping)</option>
                      <option value="HYBRID">Hybrid (Both)</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      High-Level provides quick scoring via questionnaire. Deep-Dive maps your full infrastructure. Hybrid includes both.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Assessment'}
                    </Button>
                    <Button variant="outline-secondary" onClick={() => navigate('/assessments')}>
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

export default CreateAssessmentPage;
