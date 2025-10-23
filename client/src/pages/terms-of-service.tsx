import React from 'react';
import Sidebar from '@/components/layout/Sidebar'; // Adjust import path as needed
import RightSidebar from '@/components/layout/RightSidebar'; // Adjust import path as needed

const TermsOfService: React.FC = () => {
  const handleAccept = () => {
    alert('Terms of Service accepted!');
    // In a real app, you would typically set this in localStorage or context
    localStorage.setItem('tos-accepted', 'true');
  };

  const handleDecline = () => {
    alert('You must accept the Terms of Service to continue.');
    // In a real app, you might redirect or show a modal
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
        maxWidth: '800px', 
        margin: '20px auto', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.6'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '28px', 
              color: '#1890ff',
              fontWeight: '600'
            }}>
              📋 Terms of Service
            </h1>
            <p style={{ 
              margin: '0', 
              color: '#666',
              fontSize: '16px'
            }}>
              Last updated: 1ST OCTOBER, 2025
            </p>
          </div>

          {/* Terms Content */}
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            padding: '20px',
            border: '1px solid #e8e8e8',
            borderRadius: '6px',
            backgroundColor: '#fafafa',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>1. Agreement to Terms</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>2. Use License</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              Permission is granted to temporarily use our services for personal, non-commercial transitory viewing only.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>3. User Responsibilities</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>4. Privacy Policy</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              Your privacy is important to us. Please read our Privacy Policy which explains how we collect, use, and protect your personal information.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>5. Intellectual Property</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              All content included on this site, such as text, graphics, logos, and images, is the property of our company and protected by copyright laws.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>6. Termination</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              We may terminate or suspend access to our service immediately, without prior notice, for any reason whatsoever.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>7. Limitation of Liability</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              In no event shall our company be liable for any damages arising out of the use or inability to use our services.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>8. Changes to Terms</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              We reserve the right to modify these terms at any time. We will notify users of any changes by updating the date at the top of this page.
            </p>

            <h2 style={{ color: '#333', fontSize: '20px', marginBottom: '16px' }}>9. Contact Information</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              If you have any questions about these Terms of Service, please contact us at support@company.com.
            </p>
          </div>

          {/* Acceptance Checkbox */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f0f8ff',
            borderRadius: '6px',
            border: '1px solid #bae7ff'
          }}>
            <input 
              type="checkbox" 
              id="accept-tos" 
              style={{ 
                marginTop: '2px',
                width: '18px',
                height: '18px'
              }}
            />
            <label 
              htmlFor="accept-tos" 
              style={{ 
                color: '#333',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              I have read, understood, and agree to be bound by these Terms of Service. 
              I acknowledge that I am responsible for complying with all terms and conditions outlined above.
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center'
          }}>
            <button
              onClick={handleAccept}
              style={{
                padding: '12px 32px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#52c41a',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flex: 1
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#73d13d';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#52c41a';
              }}
            >
              ✅ Accept Terms
            </button>

            <button
              onClick={handleDecline}
              style={{
                padding: '12px 32px',
                border: '1px solid #ff4d4f',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#ff4d4f',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flex: 1
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fff2f0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              ❌ Decline
            </button>
          </div>

          {/* Footer Note */}
          <div style={{ 
            marginTop: '24px', 
            padding: '12px',
            backgroundColor: '#fffbe6',
            borderRadius: '4px',
            border: '1px solid #ffe58f'
          }}>
            <p style={{ 
              margin: '0', 
              fontSize: '12px', 
              color: '#8c6e12',
              lineHeight: '1.4',
              textAlign: 'center'
            }}>
              <strong>Important:</strong> You must accept our Terms of Service to continue using our services. 
              If you decline, you will not be able to access certain features.
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

export default TermsOfService;