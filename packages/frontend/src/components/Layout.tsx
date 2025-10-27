import React, { ReactNode } from 'react';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="white" expand="lg" className="mb-4">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                height="30"
                className="d-inline-block align-top me-2"
                alt={branding.organizationName}
              />
            )}
            {branding.organizationName}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/assessments">Assessments</Nav.Link>
            </Nav>
            <Nav>
              <NavDropdown
                title={`${user?.firstName} ${user?.lastName}`}
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item disabled>
                  <small className="text-muted">{user?.email}</small>
                </NavDropdown.Item>
                <NavDropdown.Item disabled>
                  <small className="text-muted">
                    Role: {user?.role}
                  </small>
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1">
        {children}
      </Container>

      <footer className="mt-auto py-3 bg-light border-top">
        <Container fluid>
          <div className="row">
            <div className="col-md-6 text-center text-md-start">
              <small className="text-muted">
                © {new Date().getFullYear()} {branding.organizationName}. All rights reserved.
              </small>
            </div>
            <div className="col-md-6 text-center text-md-end">
              {branding.contactEmail && (
                <small className="text-muted me-3">
                  <a href={`mailto:${branding.contactEmail}`} className="text-decoration-none">
                    {branding.contactEmail}
                  </a>
                </small>
              )}
              {branding.website && (
                <small className="text-muted">
                  <a href={branding.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    Website
                  </a>
                </small>
              )}
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};
