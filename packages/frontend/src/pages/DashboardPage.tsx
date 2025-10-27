import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Layout } from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery('assessments', async () => {
    const response = await api.get('/assessments', {
      params: { page: 1, pageSize: 10 }
    });
    return response.data.data;
  });

  const recentAssessments = assessments?.slice(0, 5) || [];

  return (
    <Layout>
      <Container>
        <Row className="mb-4">
          <Col>
            <h1 className="mb-2">Welcome back, {user?.firstName}!</h1>
            <p className="text-muted">
              Manage your disaster recovery assessments and track your infrastructure resilience.
            </p>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="score-display text-primary">
                  {assessments?.length || 0}
                </div>
                <div className="score-label">Total Assessments</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="score-display text-success">
                  {assessments?.filter((a: any) => a.status === 'COMPLETED').length || 0}
                </div>
                <div className="score-label">Completed</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="score-display text-warning">
                  {assessments?.filter((a: any) => a.status === 'IN_PROGRESS').length || 0}
                </div>
                <div className="score-label">In Progress</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="score-display text-info">
                  {assessments?.filter((a: any) => a.status === 'DRAFT').length || 0}
                </div>
                <div className="score-label">Drafts</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Assessments</h5>
                  <Button variant="link" onClick={() => navigate('/assessments')}>
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : recentAssessments.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted mb-3">No assessments yet</p>
                    <Button variant="primary" onClick={() => navigate('/assessments/new')}>
                      Create Your First Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {recentAssessments.map((assessment: any) => (
                      <div
                        key={assessment.id}
                        className="list-group-item list-group-item-action cursor-pointer"
                        onClick={() => navigate(`/assessments/${assessment.id}`)}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">{assessment.name}</h6>
                          <small className="text-muted">
                            {new Date(assessment.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {assessment.type.replace(/_/g, ' ')}
                          </small>
                          <span className={`badge bg-${getStatusColor(assessment.status)}`}>
                            {assessment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/assessments/new')}
                  >
                    + New Assessment
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate('/assessments')}
                  >
                    View All Assessments
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Getting Started</h5>
              </Card.Header>
              <Card.Body>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Create an assessment
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-circle text-muted me-2"></i>
                    Complete questionnaire
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-circle text-muted me-2"></i>
                    Map your infrastructure
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-circle text-muted me-2"></i>
                    Analyze risks
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-circle text-muted me-2"></i>
                    Download report
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'DRAFT':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export default DashboardPage;
