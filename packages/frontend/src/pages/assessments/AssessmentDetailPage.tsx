import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';

const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading } = useQuery(['assessment', id], async () => {
    const response = await api.get(`/assessments/${id}`);
    return response.data.data;
  });

  if (isLoading) {
    return (
      <Layout>
        <Container className="text-center py-5">
          <div className="spinner-border text-primary" />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Row className="mb-4">
          <Col>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate('/assessments')}>
              ← Back to Assessments
            </Button>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h1>{assessment?.name}</h1>
                <p className="text-muted">{assessment?.description || 'No description provided'}</p>
              </div>
              <Badge bg={assessment?.status === 'COMPLETED' ? 'success' : 'warning'}>
                {assessment?.status}
              </Badge>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <h6 className="text-muted mb-2">Type</h6>
                <p className="mb-0">{assessment?.type.replace(/_/g, ' ')}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <h6 className="text-muted mb-2">Created</h6>
                <p className="mb-0">{new Date(assessment?.createdAt).toLocaleDateString()}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <h6 className="text-muted mb-2">Last Updated</h6>
                <p className="mb-0">{new Date(assessment?.updatedAt).toLocaleDateString()}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <h6 className="text-muted mb-2">Progress</h6>
                <p className="mb-0">{assessment?.status === 'COMPLETED' ? '100%' : '50%'}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6} className="mb-3">
            <Card className="shadow-sm h-100">
              <Card.Header><h5 className="mb-0">Assessment Actions</h5></Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {(assessment?.type === 'HIGH_LEVEL' || assessment?.type === 'HYBRID') && (
                    <Button variant="primary" onClick={() => navigate(`/assessments/${id}/high-level`)}>
                      Complete Questionnaire
                    </Button>
                  )}
                  {(assessment?.type === 'DEEP_DIVE' || assessment?.type === 'HYBRID') && (
                    <Button variant="primary" onClick={() => navigate(`/assessments/${id}/deep-dive`)}>
                      Map Infrastructure
                    </Button>
                  )}
                  <Button variant="success" onClick={() => navigate(`/assessments/${id}/analysis`)}>
                    View Analysis
                  </Button>
                  <Button variant="info" onClick={() => navigate(`/assessments/${id}/risks`)}>
                    View Risks
                  </Button>
                  <Button variant="warning" onClick={() => navigate(`/assessments/${id}/recommendations`)}>
                    View Recommendations
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-3">
            <Card className="shadow-sm h-100">
              <Card.Header><h5 className="mb-0">Reports</h5></Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">Generate comprehensive PDF reports</p>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" onClick={() => window.open(`/api/assessments/${id}/report/pdf`, '_blank')}>
                    Download Full Report
                  </Button>
                  <Button variant="outline-secondary" onClick={() => window.open(`/api/assessments/${id}/report/executive-summary`, '_blank')}>
                    Download Executive Summary
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

export default AssessmentDetailPage;
