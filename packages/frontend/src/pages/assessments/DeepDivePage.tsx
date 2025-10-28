import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Tabs, Tab, Modal, Form, ListGroup, Badge, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Layout } from '../../components/Layout';
import { api, handleApiError } from '../../lib/api';
import DOMPurify from 'dompurify';

const DeepDivePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sites');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'site' | 'system' | 'component' | 'service' | 'dependency'>('site');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Form states
  const [siteForm, setSiteForm] = useState({
    name: '',
    description: '',
    siteType: 'CLOUD',
    provider: '',
    region: ''
  });

  const [systemForm, setSystemForm] = useState({
    name: '',
    description: '',
    businessCriticality: 'MEDIUM',
    rpoMinutes: '',
    rtoMinutes: ''
  });

  const [componentForm, setComponentForm] = useState({
    name: '',
    description: '',
    componentType: 'COMPUTE',
    isRedundant: false,
    hasHealthCheck: false
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    version: '',
    description: '',
    port: ''
  });

  // Queries
  const { data: sites } = useQuery(['sites', id], async () => {
    const response = await api.get(`/assessments/${id}/sites`);
    return response.data.data;
  });

  const { data: systems } = useQuery(['systems', selectedParent], async () => {
    if (!selectedParent) return [];
    const response = await api.get(`/sites/${selectedParent}/systems`);
    return response.data.data;
  }, { enabled: !!selectedParent });

  const { data: components } = useQuery(['components', selectedParent], async () => {
    if (!selectedParent) return [];
    const response = await api.get(`/systems/${selectedParent}/components`);
    return response.data.data;
  }, { enabled: !!selectedParent && activeTab === 'components' });

  const { data: services } = useQuery(['services', selectedParent], async () => {
    if (!selectedParent) return [];
    const response = await api.get(`/components/${selectedParent}/services`);
    return response.data.data;
  }, { enabled: !!selectedParent && activeTab === 'services' });

  // Mutations
  const createSiteMutation = useMutation(
    async (data: any) => await api.post(`/assessments/${id}/sites`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['sites', id]);
        handleCloseModal();
      },
      onError: (err) => setError(handleApiError(err))
    }
  );

  const createSystemMutation = useMutation(
    async (data: any) => await api.post(`/sites/${selectedParent}/systems`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['systems', selectedParent]);
        handleCloseModal();
      },
      onError: (err) => setError(handleApiError(err))
    }
  );

  const createComponentMutation = useMutation(
    async (data: any) => await api.post(`/systems/${selectedParent}/components`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['components', selectedParent]);
        handleCloseModal();
      },
      onError: (err) => setError(handleApiError(err))
    }
  );

  const createServiceMutation = useMutation(
    async (data: any) => await api.post(`/components/${selectedParent}/services`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['services', selectedParent]);
        handleCloseModal();
      },
      onError: (err) => setError(handleApiError(err))
    }
  );

  const deleteMutation = useMutation(
    async ({ type, itemId }: { type: string; itemId: string }) => {
      await api.delete(`/${type}/${itemId}`);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries([`${variables.type}s`]);
      }
    }
  );

  const handleOpenModal = (type: typeof modalType, parentId?: string) => {
    setModalType(type);
    if (parentId) setSelectedParent(parentId);
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSiteForm({ name: '', description: '', siteType: 'CLOUD', provider: '', region: '' });
    setSystemForm({ name: '', description: '', businessCriticality: 'MEDIUM', rpoMinutes: '', rtoMinutes: '' });
    setComponentForm({ name: '', description: '', componentType: 'COMPUTE', isRedundant: false, hasHealthCheck: false });
    setServiceForm({ name: '', version: '', description: '', port: '' });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    switch (modalType) {
      case 'site':
        createSiteMutation.mutate(siteForm);
        break;
      case 'system':
        createSystemMutation.mutate({
          ...systemForm,
          rpoMinutes: systemForm.rpoMinutes ? parseInt(systemForm.rpoMinutes) : null,
          rtoMinutes: systemForm.rtoMinutes ? parseInt(systemForm.rtoMinutes) : null
        });
        break;
      case 'component':
        createComponentMutation.mutate(componentForm);
        break;
      case 'service':
        createServiceMutation.mutate({
          ...serviceForm,
          port: serviceForm.port ? parseInt(serviceForm.port) : null
        });
        break;
    }
  };

  const handleDelete = (type: string, itemId: string) => {
    if (window.confirm(`Are you sure you want to delete this ${type}? This will also delete all child items.`)) {
      deleteMutation.mutate({ type, itemId });
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
            <h1>Deep-Dive Infrastructure Mapping</h1>
            <p className="text-muted">Build your infrastructure hierarchy: Sites → Systems → Components → Services</p>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Body>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'sites')} className="mb-3">
              <Tab eventKey="sites" title={`Sites (${sites?.length || 0})`}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Sites</h5>
                  <Button variant="primary" onClick={() => handleOpenModal('site')}>
                    + Add Site
                  </Button>
                </div>
                {sites?.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">No sites defined yet. Add your first data center or cloud region.</p>
                  </div>
                ) : (
                  <ListGroup>
                    {sites?.map((site: any) => (
                      <ListGroup.Item key={site.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{site.name}</h6>
                          <small className="text-muted">
                            {site.siteType.replace(/_/g, ' ')}
                            {site.provider && ` • ${site.provider}`}
                            {site.region && ` • ${site.region}`}
                          </small>
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-2"
                            onClick={() => {
                              setSelectedParent(site.id);
                              setActiveTab('systems');
                            }}
                          >
                            View Systems
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete('sites', site.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Tab>

              <Tab eventKey="systems" title={`Systems ${selectedParent ? `(${systems?.length || 0})` : ''}`}>
                {!selectedParent ? (
                  <Alert variant="info">Select a site from the Sites tab to view its systems.</Alert>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Systems in Site</h5>
                      <Button variant="primary" onClick={() => handleOpenModal('system', selectedParent)}>
                        + Add System
                      </Button>
                    </div>
                    {systems?.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No systems defined yet.</p>
                      </div>
                    ) : (
                      <ListGroup>
                        {systems?.map((system: any) => (
                          <ListGroup.Item key={system.id} className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{system.name}</h6>
                              <div>
                                <Badge bg={getCriticalityColor(system.businessCriticality)}>
                                  {system.businessCriticality}
                                </Badge>
                                {system.rpoMinutes && <small className="text-muted ms-2">RPO: {system.rpoMinutes}m</small>}
                                {system.rtoMinutes && <small className="text-muted ms-2">RTO: {system.rtoMinutes}m</small>}
                              </div>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="me-2"
                                onClick={() => {
                                  setSelectedParent(system.id);
                                  setActiveTab('components');
                                }}
                              >
                                View Components
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete('systems', system.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </>
                )}
              </Tab>

              <Tab eventKey="components" title={`Components ${selectedParent && activeTab === 'components' ? `(${components?.length || 0})` : ''}`}>
                {!selectedParent ? (
                  <Alert variant="info">Select a system from the Systems tab to view its components.</Alert>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Components in System</h5>
                      <Button variant="primary" onClick={() => handleOpenModal('component', selectedParent)}>
                        + Add Component
                      </Button>
                    </div>
                    {components?.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No components defined yet.</p>
                      </div>
                    ) : (
                      <ListGroup>
                        {components?.map((component: any) => (
                          <ListGroup.Item key={component.id} className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{component.name}</h6>
                              <div>
                                <Badge bg="secondary">{component.componentType.replace(/_/g, ' ')}</Badge>
                                {component.isRedundant && <Badge bg="success" className="ms-1">Redundant</Badge>}
                                {component.hasHealthCheck && <Badge bg="info" className="ms-1">Health Check</Badge>}
                              </div>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="me-2"
                                onClick={() => {
                                  setSelectedParent(component.id);
                                  setActiveTab('services');
                                }}
                              >
                                View Services
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete('components', component.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </>
                )}
              </Tab>

              <Tab eventKey="services" title={`Services ${selectedParent && activeTab === 'services' ? `(${services?.length || 0})` : ''}`}>
                {!selectedParent ? (
                  <Alert variant="info">Select a component from the Components tab to view its services.</Alert>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Services on Component</h5>
                      <Button variant="primary" onClick={() => handleOpenModal('service', selectedParent)}>
                        + Add Service
                      </Button>
                    </div>
                    {services?.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No services defined yet.</p>
                      </div>
                    ) : (
                      <ListGroup>
                        {services?.map((service: any) => (
                          <ListGroup.Item key={service.id} className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{service.name}</h6>
                              <small className="text-muted">
                                {service.version && `v${service.version}`}
                                {service.port && ` • Port ${service.port}`}
                              </small>
                            </div>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete('services', service.id)}
                            >
                              Delete
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </>
                )}
              </Tab>

              <Tab eventKey="dependencies" title="Dependencies">
                <div className="text-center py-5">
                  <h5>Component Dependencies</h5>
                  <p className="text-muted">Use the Dependency Graph visualization to map and visualize component dependencies.</p>
                  <Button variant="primary" onClick={() => navigate(`/assessments/${id}/dependencies`)}>
                    View Dependency Graph
                  </Button>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      {/* Modal for adding items */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            {modalType === 'site' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={siteForm.name}
                    onChange={(e) => setSiteForm({ ...siteForm, name: DOMPurify.sanitize(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={siteForm.description}
                    onChange={(e) => setSiteForm({ ...siteForm, description: DOMPurify.sanitize(e.target.value) })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Site Type</Form.Label>
                  <Form.Select
                    value={siteForm.siteType}
                    onChange={(e) => setSiteForm({ ...siteForm, siteType: e.target.value })}
                  >
                    <option value="CLOUD">Cloud</option>
                    <option value="ON_PREMISE">On-Premise</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="COLO">Colocation</option>
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Provider</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="AWS, Azure, GCP, etc."
                        value={siteForm.provider}
                        onChange={(e) => setSiteForm({ ...siteForm, provider: DOMPurify.sanitize(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Region</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="us-east-1, westus, etc."
                        value={siteForm.region}
                        onChange={(e) => setSiteForm({ ...siteForm, region: DOMPurify.sanitize(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {modalType === 'system' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={systemForm.name}
                    onChange={(e) => setSystemForm({ ...systemForm, name: DOMPurify.sanitize(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={systemForm.description}
                    onChange={(e) => setSystemForm({ ...systemForm, description: DOMPurify.sanitize(e.target.value) })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Business Criticality</Form.Label>
                  <Form.Select
                    value={systemForm.businessCriticality}
                    onChange={(e) => setSystemForm({ ...systemForm, businessCriticality: e.target.value })}
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>RPO (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Recovery Point Objective"
                        value={systemForm.rpoMinutes}
                        onChange={(e) => setSystemForm({ ...systemForm, rpoMinutes: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>RTO (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Recovery Time Objective"
                        value={systemForm.rtoMinutes}
                        onChange={(e) => setSystemForm({ ...systemForm, rtoMinutes: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {modalType === 'component' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({ ...componentForm, name: DOMPurify.sanitize(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={componentForm.description}
                    onChange={(e) => setComponentForm({ ...componentForm, description: DOMPurify.sanitize(e.target.value) })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Component Type</Form.Label>
                  <Form.Select
                    value={componentForm.componentType}
                    onChange={(e) => setComponentForm({ ...componentForm, componentType: e.target.value })}
                  >
                    <option value="COMPUTE">Compute</option>
                    <option value="STORAGE">Storage</option>
                    <option value="DATABASE">Database</option>
                    <option value="NETWORK">Network</option>
                    <option value="LOAD_BALANCER">Load Balancer</option>
                    <option value="CACHE">Cache</option>
                    <option value="MESSAGE_QUEUE">Message Queue</option>
                    <option value="CDN">CDN</option>
                    <option value="DNS">DNS</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
                <Form.Check
                  type="checkbox"
                  label="Is Redundant"
                  checked={componentForm.isRedundant}
                  onChange={(e) => setComponentForm({ ...componentForm, isRedundant: e.target.checked })}
                  className="mb-3"
                />
                <Form.Check
                  type="checkbox"
                  label="Has Health Check"
                  checked={componentForm.hasHealthCheck}
                  onChange={(e) => setComponentForm({ ...componentForm, hasHealthCheck: e.target.checked })}
                />
              </>
            )}

            {modalType === 'service' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: DOMPurify.sanitize(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Version</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="1.0.0"
                        value={serviceForm.version}
                        onChange={(e) => setServiceForm({ ...serviceForm, version: DOMPurify.sanitize(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Port</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="8080"
                        value={serviceForm.port}
                        onChange={(e) => setServiceForm({ ...serviceForm, port: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: DOMPurify.sanitize(e.target.value) })}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={
              modalType === 'site' ? createSiteMutation.isLoading :
              modalType === 'system' ? createSystemMutation.isLoading :
              modalType === 'component' ? createComponentMutation.isLoading :
              createServiceMutation.isLoading
            }>
              {modalType === 'site' && createSiteMutation.isLoading ? 'Creating...' :
               modalType === 'system' && createSystemMutation.isLoading ? 'Creating...' :
               modalType === 'component' && createComponentMutation.isLoading ? 'Creating...' :
               modalType === 'service' && createServiceMutation.isLoading ? 'Creating...' :
               'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

const getCriticalityColor = (criticality: string) => {
  switch (criticality) {
    case 'CRITICAL': return 'danger';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'success';
    default: return 'secondary';
  }
};

export default DeepDivePage;
