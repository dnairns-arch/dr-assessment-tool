import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';

const RisksPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: risks, isLoading } = useQuery(['risks', id], async () => {
    const response = await api.get(`/assessments/${id}/risks`);
    return response.data.data;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
            <h1>Identified Risks</h1>
            <p className="text-muted">Review all identified disaster recovery risks</p>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Body>
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : risks?.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No risks identified yet. Run an analysis first.</p>
                <Button variant="primary" onClick={() => navigate(`/assessments/${id}/analysis`)}>
                  Run Analysis
                </Button>
              </div>
            ) : (
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Component</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {risks?.map((risk: any) => (
                    <tr key={risk.id}>
                      <td>
                        <Badge bg={getSeverityColor(risk.severity)}>
                          {risk.severity}
                        </Badge>
                      </td>
                      <td>{risk.riskType.replace(/_/g, ' ')}</td>
                      <td><strong>{risk.title}</strong></td>
                      <td>{risk.component?.name || 'N/A'}</td>
                      <td>{risk.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};

export default RisksPage;
