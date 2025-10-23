import React from 'react';
import Sidebar from '@/components/layout/Sidebar'; // Adjust import path as needed
import RightSidebar from '@/components/layout/RightSidebar'; // Adjust import path as needed

const PrivacyPolicy: React.FC = () => {
  const handleContact = () => {
    window.location.href = 'mailto:eldady.inc@gmail.com';
  };

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Left Sidebar */}
      <div style={{ width: '250px', flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        maxWidth: '900px', 
        margin: '20px auto', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.6',
        color: '#333'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '40px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '32px', 
              color: '#1890ff',
              fontWeight: '600'
            }}>
              🔒 Privacy Policy
            </h1>
            <p style={{ 
              margin: '0 0 8px 0', 
              color: '#666',
              fontSize: '16px'
            }}>
              Compliant with Kenya's Data Protection Act No. 24 of 2019
            </p>
            <p style={{ 
              margin: '0', 
              color: '#999',
              fontSize: '14px'
            }}>
              Last updated: October 01, 2025
            </p>
          </div>

          {/* Introduction */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '16px' }}>1.1 Introduction</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              This Privacy Policy governs the collection, use, and protection of personal data by LDADY, 
              a social-commerce platform registered in Kenya. This policy complies with the Data Protection 
              Act No. 24 of 2019 and the Constitution of Kenya 2010.
            </p>
          </section>

          {/* Data We Collect */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>1.2 Data We Collect</h2>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>1.2.1 Personal Information</h3>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>Full names and contact information</li>
                <li>Email addresses and phone numbers</li>
                <li>Physical addresses for delivery purposes</li>
                <li>National identification or passport numbers (for sellers)</li>
                <li>Banking details (for verified sellers)</li>
                <li>Profile photographs and business documentation</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>1.2.2 Transaction Data</h3>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>Purchase history and preferences</li>
                <li>Payment information (handled by third-party processors)</li>
                <li>Communication between buyers and sellers</li>
                <li>Product reviews and ratings</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>1.2.3 Technical Data</h3>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>IP addresses and device information</li>
                <li>Browser type and operating system</li>
                <li>Usage patterns and platform interactions</li>
                <li>Location data (with consent)</li>
              </ul>
            </div>
          </section>

          {/* Consent Mechanisms */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>1.3 Consent Mechanisms</h2>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>1.3.1 Explicit Consent</h3>
              <p style={{ color: '#555', marginBottom: '12px' }}>
                Before collecting any personal data, we obtain explicit, informed consent through:
              </p>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>Clear, plain-language consent checkbox at sign up</li>
                <li>Age verification for users under 18 years</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>1.3.2 Withdrawal of Consent</h3>
              <p style={{ color: '#555', marginBottom: '12px' }}>
                Users may withdraw consent at any time by:
              </p>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>Deleting your account</li>
                <li>Submitting written requests for data deletion</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>1.4 Data Security Measures</h2>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>1.4.1 Technical Safeguards</h3>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>End-to-end encryption for sensitive data transmission</li>
                <li>Secure Socket Layer (SSL) certificates for all pages</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication for admin access</li>
                <li>Automated backup systems with encryption</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>1.4.2 Administrative Safeguards</h3>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>Access controls and authorization protocols</li>
                <li>Regular review of data processing activities</li>
                <li>Incident response procedures</li>
                <li>Third-party vendor security assessments</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '16px' }}>1.5 Data Sharing and Disclosure</h2>
            <p style={{ color: '#555', marginBottom: '12px' }}>
              We only share personal data:
            </p>
            <ul style={{ color: '#555', paddingLeft: '20px', marginBottom: '16px' }}>
              <li>With explicit user consent</li>
              <li>To facilitate transactions between buyers and sellers</li>
              <li>With payment processors for transaction completion</li>
              <li>When required by law or court order</li>
              <li>To protect our legal rights or prevent fraud</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '16px' }}>1.6 Data Retention</h2>
            <ul style={{ color: '#555', paddingLeft: '20px' }}>
              <li><strong>User account data:</strong> Retained while account is active plus 7 years</li>
              <li><strong>Transaction records:</strong> 7 years as required by Kenya Revenue Authority</li>
              <li><strong>Marketing data:</strong> Until consent is withdrawn</li>
              <li><strong>Technical logs:</strong> 12 months maximum</li>
              <li><strong>Deleted data:</strong> Permanently removed within 30 days</li>
            </ul>
          </section>

          {/* User Rights */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>2. Data Protection and User Rights</h2>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>Your Rights Under Kenya's Data Protection Act</h3>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li><strong>Right to Information:</strong> Know what data we collect and why</li>
                <li><strong>Right of Access:</strong> Access your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
                <li><strong>Right to Object:</strong> Object to data processing</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#444', fontSize: '20px', marginBottom: '12px' }}>Exercising Your Rights</h3>
              <p style={{ color: '#555', marginBottom: '12px' }}>
                To exercise these rights, contact our Data Protection Officer:
              </p>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>Email: eldady.inc@gmail.com</li>
                <li>Response time: Maximum 30 days from receipt of request</li>
              </ul>
            </div>
          </section>

          {/* Contact Section */}
          <section style={{ 
            marginTop: '40px', 
            padding: '24px',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
            border: '1px solid #bae7ff'
          }}>
            <h3 style={{ color: '#333', fontSize: '20px', marginBottom: '16px', textAlign: 'center' }}>
              📞 Contact Information
            </h3>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#555', marginBottom: '12px' }}>
                <strong>Data Protection Officer:</strong> eldady.inc@gmail.com
              </p>
              <button
                onClick={handleContact}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#40a9ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1890ff';
                }}
              >
                📧 Contact Data Protection Officer
              </button>
            </div>
          </section>

          {/* Legal Compliance */}
          <div style={{ 
            marginTop: '30px', 
            padding: '16px',
            backgroundColor: '#fffbe6',
            borderRadius: '6px',
            border: '1px solid #ffe58f'
          }}>
            <p style={{ 
              margin: '0', 
              fontSize: '12px', 
              color: '#8c6e12',
              lineHeight: '1.4',
              textAlign: 'center'
            }}>
              <strong>Legal Compliance:</strong> This document complies with the Data Protection Act No. 24 of 2019, 
              Constitution of Kenya 2010, and other applicable Kenyan laws.
            </p>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ width: '300px', flexShrink: 0 }}>
        <RightSidebar />
      </div>
    </div>
  );
};

export default PrivacyPolicy;