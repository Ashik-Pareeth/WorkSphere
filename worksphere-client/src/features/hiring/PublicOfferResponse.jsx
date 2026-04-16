import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPublicOffer, respondToOffer } from '../../api/hiringApi';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  FileSignature,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Briefcase,
  IndianRupee,
  Building,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const PublicOfferResponse = () => {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadOffer = async () => {
      if (!token) {
        setPageError('Invalid or missing access token.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetchPublicOffer(offerId, token);
        if (!mounted) return;
        setOffer(res.data);
      } catch (err) {
        if (!mounted) return;
        setPageError(
          err.response?.data?.message ||
            'Failed to securely load the offer details.'
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOffer();
    return () => (mounted = false);
  }, [offerId, token]);

  const initiateAction = (accept) => {
    setSubmitError(null);
    setPendingAction(accept);
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    setIsDialogOpen(false);
    setIsSubmitting(true);

    try {
      await respondToOffer(offerId, pendingAction, token);
      setResponseStatus(pendingAction ? 'ACCEPTED' : 'DECLINED');
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          'Failed to process your response. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔄 Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-3">
            <Skeleton className="h-10 w-40 mx-auto" />
            <Skeleton className="h-4 w-60 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ❌ Error
  if (pageError && !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-destructive/40">
          <CardHeader>
            <AlertCircle className="mx-auto w-12 h-12 text-destructive mb-2" />
            <CardTitle>Access Error</CardTitle>
            <CardDescription>{pageError}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ✅ After response
  if (responseStatus) {
    const isAccepted = responseStatus === 'ACCEPTED';

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            {isAccepted ? (
              <CheckCircle2 className="mx-auto w-14 h-14 text-green-600 mb-3" />
            ) : (
              <XCircle className="mx-auto w-14 h-14 text-muted-foreground mb-3" />
            )}
            <CardTitle>Offer {responseStatus}</CardTitle>
            <CardDescription>
              {isAccepted
                ? 'Welcome aboard! HR will contact you shortly.'
                : 'You have declined the offer. We wish you the best.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="w-full">
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 🎯 Main UI
  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-3">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Employment Offer</h1>
          <p className="text-muted-foreground text-sm">
            Please review your offer details carefully
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-t-4 border-primary">
          <CardHeader>
            <CardTitle>Welcome, {offer?.candidateName}</CardTitle>
            <CardDescription>
              You have been selected for the role of{' '}
              <span className="font-semibold">{offer?.jobTitle}</span> in the{' '}
              <span className="font-semibold">{offer?.departmentName}</span>{' '}
              department.
            </CardDescription>
          </CardHeader>

          <Separator />

          <CardContent className="grid sm:grid-cols-2 gap-4 pt-6">
            {/* Role */}
            <InfoCard
              icon={<Briefcase />}
              label="Position"
              value={offer?.jobTitle}
            />

            {/* Dept */}
            <InfoCard
              icon={<Building />}
              label="Department"
              value={offer?.departmentName}
            />

            {/* Salary */}
            <InfoCard
              icon={<IndianRupee />}
              label="Compensation"
              value={`₹ ${offer?.proposedSalary?.toLocaleString('en-IN')}`}
              highlight
            />

            {/* Date */}
            <InfoCard
              icon={<Calendar />}
              label="Joining Date"
              value={
                offer?.joiningDate
                  ? new Date(offer.joiningDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'To be decided'
              }
            />
          </CardContent>

          <Separator />

          <CardFooter className="flex flex-col gap-4 pt-6">
            {submitError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button
                variant="outline"
                className="flex-1 border-destructive text-destructive"
                onClick={() => initiateAction(false)}
                disabled={isSubmitting}
              >
                Decline
              </Button>

              <Button
                className="flex-1"
                onClick={() => initiateAction(true)}
                disabled={isSubmitting}
              >
                Accept
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Dialog */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingAction ? 'Accept Offer?' : 'Decline Offer?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingAction
                  ? 'This will start your onboarding process.'
                  : 'This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAction}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// 🔹 Reusable Info Card
const InfoCard = ({ icon, label, value, highlight }) => (
  <Card className="bg-muted/50 border-none shadow-none">
    <CardContent className="p-4 flex items-start gap-3">
      <div className={`mt-1 ${highlight ? 'text-green-600' : 'text-primary'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-semibold ${highlight ? 'text-green-600' : ''}`}>
          {value || '-'}
        </p>
      </div>
    </CardContent>
  </Card>
);

export default PublicOfferResponse;
