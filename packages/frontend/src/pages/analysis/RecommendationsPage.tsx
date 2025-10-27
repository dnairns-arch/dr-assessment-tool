import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';

const RecommendationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: recommendations, isLoading } = useQuery(['recommendations', id], async () => {
    const response = await api.get(`/assessments/${id}/recommendations`);
    return response.data.data;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Layout>
      <Container>
        <Row className="mb-4">
          <Col>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/assessments/${id}`)}>
              ← Back
            </Button>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <h1>Recommendations</h1>
            <p className="text-muted">Actionable recommendations to improve your DR readiness</p>
          </Col>
        </Row>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : recommendations?.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <p className="text-muted">No recommendations available yet. Run an analysis first.</p>
              <Button variant="primary" onClick={() => navigate(`/assessments/${id}/analysis`)}>
                Run Analysis
              </Button>
            </Card.Body>
          </Card>
        ) : (
          recommendations?.map((rec: any) => (
            <Card key={rec.id} className="shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5>{rec.title}</h5>
                  <Badge bg={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                </div>
                <p className="text-muted">{rec.description}</p>
                <div className="d-flex gap-3 mb-3">
                  <small><strong>Category:</strong> {rec.category}</small>
                  <small><strong>Effort:</strong> {rec.effort}</small>
                  <small><strong>Status:</strong> {rec.status}</small>
                </div>
                {rec.actionItems && rec.actionItems.length > 0 && (
                  <>
                    <h6>Action Items:</h6>
                    <ul>
                      {rec.actionItems.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </Card.Body>
            </Card>
          ))
        )}
      </Container>
    </Layout>
  );
};

export default RecommendationsPage;
