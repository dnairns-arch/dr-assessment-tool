import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../../components/Layout';

const DeepDivePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
            <h1>Deep-Dive Infrastructure Mapping</h1>
            <p className="text-muted">Map your infrastructure hierarchy: Sites → Systems → Components → Services</p>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Body>
            <Tabs defaultActiveKey="sites" className="mb-3">
              <Tab eventKey="sites" title="Sites">
                <div className="text-center py-5">
                  <h5>Sites</h5>
                  <p className="text-muted">Add data centers, cloud regions, or other physical/virtual locations</p>
                  <Button variant="primary">+ Add Site</Button>
                </div>
              </Tab>
              <Tab eventKey="systems" title="Systems">
                <div className="text-center py-5">
                  <h5>Systems</h5>
                  <p className="text-muted">Define systems within each site</p>
                </div>
              </Tab>
              <Tab eventKey="components" title="Components">
                <div className="text-center py-5">
                  <h5>Components</h5>
                  <p className="text-muted">Add infrastructure components (compute, storage, databases, etc.)</p>
                </div>
              </Tab>
              <Tab eventKey="services" title="Services">
                <div className="text-center py-5">
                  <h5>Services</h5>
                  <p className="text-muted">Define services running on components</p>
                </div>
              </Tab>
              <Tab eventKey="dependencies" title="Dependencies">
                <div className="text-center py-5">
                  <h5>Dependencies</h5>
                  <p className="text-muted">Map dependencies between components</p>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};

export default DeepDivePage;
