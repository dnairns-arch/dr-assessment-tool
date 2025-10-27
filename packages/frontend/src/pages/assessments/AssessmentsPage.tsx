import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Form } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../lib/api';

const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: assessments, isLoading } = useQuery(['assessments', search, statusFilter], async () => {
    const params: any = { page: 1, pageSize: 50 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    const response = await api.get('/assessments', { params });
    return response.data.data;
  });

  return (
    <Layout>
      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1>Assessments</h1>
              <Button variant="primary" onClick={() => navigate('/assessments/new')}>
                + New Assessment
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={8}>
            <Form.Control
              type="text"
              placeholder="Search assessments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </Form.Select>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Body>
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : (
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments?.map((assessment: any) => (
                    <tr key={assessment.id} onClick={() => navigate(`/assessments/${assessment.id}`)} style={{ cursor: 'pointer' }}>
                      <td><strong>{assessment.name}</strong></td>
                      <td>{assessment.type.replace(/_/g, ' ')}</td>
                      <td>
                        <Badge bg={getStatusColor(assessment.status)}>
                          {assessment.status}
                        </Badge>
                      </td>
                      <td>{new Date(assessment.createdAt).toLocaleDateString()}</td>
                      <td>{new Date(assessment.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <Button size="sm" variant="outline-primary" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/assessments/${assessment.id}`);
                        }}>
                          View
                        </Button>
                      </td>
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

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS': return 'warning';
    case 'DRAFT': return 'secondary';
    default: return 'secondary';
  }
};

export default AssessmentsPage;
