import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { dataService } from '../dataService';
import { FamilyDetails } from '../types';

interface QRCodeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyDetails: FamilyDetails;
}

interface ShareData {
  type: 'family-invite';
  familyId: string;
  familyName: string;
  inviteCode: string;
  timestamp: number;
}

export const QRCodeShareModal: React.FC<QRCodeShareModalProps> = ({
  isOpen,
  onClose,
  familyDetails
}) => {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateShareData();
    }
  }, [isOpen, familyDetails]);

  const generateShareData = async () => {
    setIsGenerating(true);
    try {
      // Get the current family's invite code
      // Note: We'll need to add this to the family details or fetch it separately
      const inviteCode = familyDetails.inviteCode || 'TEMP-CODE';
      
      const data: ShareData = {
        type: 'family-invite',
        familyId: familyDetails.id || 'unknown',
        familyName: familyDetails.name,
        inviteCode: inviteCode,
        timestamp: Date.now()
      };
      
      setShareData(data);
    } catch (error) {
      uiLogger.error('Error generating share data', error as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareData) {
      try {
        const shareText = `Join ${shareData.familyName} on Family Planner!\nInvite Code: ${shareData.inviteCode}`;
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        uiLogger.error('Failed to copy to clipboard', error as Error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <QrCode className="text-teal-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Share Family Access</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          ) : shareData ? (
            <div className="space-y-6">
              {/* Family Info */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {shareData.familyName}
                </h3>
                <p className="text-gray-600 text-sm">
                  Scan this QR code to join the family or use the invite code below
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center bg-white p-4 rounded-xl border border-gray-200">
                <QRCode 
                  value={JSON.stringify(shareData)}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>

              {/* Invite Code */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Invite Code</p>
                    <p className="text-lg font-mono font-semibold text-gray-800 tracking-wider">
                      {shareData.inviteCode}
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className={`ml-4 p-2 rounded-lg transition-colors ${
                      copied 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">How to Join:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Scan the QR code with Family Planner app</li>
                  <li>• Or manually enter the invite code</li>
                  <li>• The new device will join this family</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to generate QR code. Please try again.</p>
              <button
                onClick={generateShareData}
                className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeShareModal;