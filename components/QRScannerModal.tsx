import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { X, Camera, Upload, AlertCircle } from 'lucide-react';
import { supabaseService } from '../supabaseService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinFamily: (familyData: any) => void;
}

interface ScannedFamilyData {
  type: 'family-invite';
  familyId: string;
  familyName: string;
  inviteCode: string;
  timestamp: number;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onJoinFamily
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [isJoining, setIsJoining] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isOpen, scanMode]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      if (!videoRef.current) return;

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera by default
        }
      );

      await qrScannerRef.current.start();
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setError('Failed to access camera. Please check permissions or use manual entry.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = async (data: string) => {
    try {
      setError(null);
      console.log('QR Code scanned:', data);

      // Try to parse as JSON first (our QR codes)
      let familyData: ScannedFamilyData;
      try {
        familyData = JSON.parse(data);
      } catch {
        // If not JSON, treat as plain invite code
        familyData = {
          type: 'family-invite',
          familyId: '',
          familyName: 'Unknown Family',
          inviteCode: data.trim(),
          timestamp: Date.now()
        };
      }

      // Validate the data
      if (familyData.type !== 'family-invite' || !familyData.inviteCode) {
        setError('Invalid QR code. Please scan a Family Planner invite code.');
        return;
      }

      await joinFamilyWithCode(familyData);
    } catch (error) {
      console.error('Error processing QR result:', error);
      setError('Failed to process QR code. Please try again.');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      setError('Please enter an invite code.');
      return;
    }

    const familyData: ScannedFamilyData = {
      type: 'family-invite',
      familyId: '',
      familyName: 'Unknown Family',
      inviteCode: manualCode.trim(),
      timestamp: Date.now()
    };

    await joinFamilyWithCode(familyData);
  };

  const joinFamilyWithCode = async (familyData: ScannedFamilyData) => {
    setIsJoining(true);
    setError(null);

    try {
      console.log('Attempting to join family with data:', familyData);

      // Use the Supabase service to join the family
      const joinResult = await supabaseService.joinFamilyByInvite(familyData.inviteCode, 'child');

      if (!joinResult.success) {
        throw new Error(joinResult.error || 'Failed to join family');
      }

      console.log('✅ Successfully joined family:', joinResult.family);

      // Enhance the family data with the actual result from Supabase
      const enhancedFamilyData = {
        ...familyData,
        familyId: joinResult.family?.id || familyData.familyId,
        familyName: joinResult.family?.name || familyData.familyName
      };

      stopScanning();
      onJoinFamily(enhancedFamilyData);
      onClose();

    } catch (error: any) {
      console.error('Error joining family:', error);
      setError(error.message || 'Failed to join family. Please check the invite code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Camera className="text-teal-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Join Family</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setScanMode('camera')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'camera'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Camera size={16} className="inline mr-2" />
              Scan QR Code
            </button>
            <button
              onClick={() => setScanMode('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'manual'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Enter Code
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 mt-0.5" size={16} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {scanMode === 'camera' ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="text-center">
                      <Camera className="mx-auto mb-2 text-white" size={32} />
                      <p className="text-white text-sm">Camera access required</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-center text-gray-600 text-sm">
                Point your camera at the QR code to join a family
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Invite Code
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter invite code (e.g., ABC123)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono tracking-wider"
                  maxLength={20}
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={isJoining || !manualCode.trim()}
                className="w-full py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isJoining ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining...
                  </div>
                ) : (
                  'Join Family'
                )}
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;