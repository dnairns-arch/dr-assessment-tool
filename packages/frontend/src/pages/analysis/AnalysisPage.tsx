import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useQuery, useMutation } from 'react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';

const AnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const analyzeMutation = useMutation(
    async () => await api.post(`/assessments/${id}/analyze`),
    {
      onSuccess: (response) => {
        const data = response.data.data;
        alert(`Analysis complete! Found ${data.summary.totalRisks} risks and ${data.summary.totalSpofs} SPOFs`);
      }
    }
  );

  const { data: metadata } = useQuery(['report-metadata', id], async () => {
    const response = await api.get(`/assessments/${id}/report/metadata`);
    return response.data.data;
  });

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
            <h1>DR Analysis</h1>
            <p className="text-muted">Run comprehensive disaster recovery analysis</p>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <h2 className="text-danger">{metadata?.sections?.analysis?.risks || 0}</h2>
                <p className="text-muted mb-0">Risks</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <h2 className="text-warning">{metadata?.sections?.analysis?.spofs || 0}</h2>
                <p className="text-muted mb-0">SPOFs</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <h2 className="text-info">{metadata?.sections?.analysis?.recommendations || 0}</h2>
                <p className="text-muted mb-0">Recommendations</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <h2 className="text-primary">{metadata?.sections?.infrastructure?.components || 0}</h2>
                <p className="text-muted mb-0">Components</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm mb-4">
          <Card.Header><h5 className="mb-0">Run Analysis</h5></Card.Header>
          <Card.Body>
            <p>Click the button below to run a comprehensive DR analysis. This will identify:</p>
            <ul>
              <li>Single Points of Failure (SPOFs)</li>
              <li>Availability, Data Loss, and Recovery Risks</li>
              <li>Provider and Region Concentration Risks</li>
              <li>Dependency and Security Risks</li>
              <li>Automated Recommendations for Improvements</li>
            </ul>
            <Button
              variant="primary"
              size="lg"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isLoading}
            >
              {analyzeMutation.isLoading ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header><h5 className="mb-0">View Results</h5></Card.Header>
          <Card.Body>
            <div className="d-grid gap-2">
              <Button variant="outline-danger" onClick={() => navigate(`/assessments/${id}/risks`)}>
                View Risks
              </Button>
              <Button variant="outline-warning" onClick={() => navigate(`/assessments/${id}/recommendations`)}>
                View Recommendations
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};

export default AnalysisPage;
