import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchOffer, respondToOffer } from '../../api/hiringApi';
import { Button } from '@/components/ui/button';
import { FileSignature, CheckCircle, XCircle, Building2 } from 'lucide-react';

const PublicOfferResponse = () => {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);

  useEffect(() => {
    if (!token) {
      setError(
        'Invalid or missing secure token. Please use the exact link from your email.'
      );
      setLoading(false);
      return;
    }

    const loadOffer = async () => {
      try {
        const res = await fetchOffer(offerId);
        setOffer(res.data);

        // If already responded
        if (res.data.status === 'ACCEPTED' || res.data.status === 'DECLINED') {
          setResponseStatus(res.data.status);
        }
      } catch (err) {
        setError('Failed to load offer details. The link may have expired.');
        console.error(err.response || err);
      } finally {
        setLoading(false);
      }
    };

    loadOffer();
  }, [offerId, token]);

  const handleAction = async (accept) => {
    if (
      !window.confirm(
        `Are you sure you want to ${accept ? 'ACCEPT' : 'DECLINE'} this offer? This action cannot be easily undone.`
      )
    )
      return;

    setLoading(true);
    try {
      await respondToOffer(offerId, accept, token);
      setResponseStatus(accept ? 'ACCEPTED' : 'DECLINED');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to process your response. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading your secure offer...
      </div>
    );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl text-center border border-red-100 dark:border-red-900">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (responseStatus) {
    const isAccepted = responseStatus === 'ACCEPTED';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl text-center border border-gray-100 dark:border-gray-800">
          {isAccepted ? (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Offer {responseStatus}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isAccepted
              ? 'Congratulations! You have accepted the offer. Our HR team will reach out with your onboarding credentials shortly.'
              : 'You have been declined this offer. We wish you the best in your future endeavors.'}
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Return to Corporate Site
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/30 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Official Employment Offer
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please review the details below carefully before making your
            decision.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="p-8 space-y-8">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-500" />
                Welcome to WorkSphere, {offer.candidate?.fullName}!
              </h3>
              <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
                <p>
                  We are thrilled to offer you the position of{' '}
                  <strong>{offer.jobOpening?.title}</strong> in the{' '}
                  <strong>{offer.jobOpening?.department?.name}</strong>{' '}
                  department.
                </p>
                <p>
                  Based on your excellent interviews and qualifications, we are
                  confident you will be a great addition to our team. Please
                  find the core compensation and logistics below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Position
                </h4>
                <p className="font-medium text-gray-900 dark:text-white">
                  {offer.jobOpening?.title}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Department
                </h4>
                <p className="font-medium text-gray-900 dark:text-white">
                  {offer.jobOpening?.department?.name}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Annual Compensation
                </h4>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">
                  $
                  {offer.proposedSalary?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Expected Start Date
                </h4>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(offer.joiningDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 mb-6 text-center">
                By accepting this offer, you agree to officially join our
                organization. You will immediately be provisioned with your
                employee accounts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-48"
                  onClick={() => handleAction(false)}
                >
                  Decline Offer
                </Button>
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white sm:w-48 shadow-lg shadow-purple-500/20"
                  onClick={() => handleAction(true)}
                >
                  Accept Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicOfferResponse;
