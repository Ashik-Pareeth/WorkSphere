import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPublicOffer, respondToOffer } from '../../api/hiringApi';

// shadcn/ui components (adjust import paths as needed for your project structure)
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

// Icons
import {
  FileSignature,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Briefcase,
  DollarSign,
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
        console.error('Failed to fetch offer:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOffer();

    return () => {
      mounted = false;
    };
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
          'Failed to process your response. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (pageError && !offer) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center pb-2">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>Unable to retrieve offer details</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Return to Corporate Site
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- POST-RESPONSE STATE ---
  if (responseStatus) {
    const isAccepted = responseStatus === 'ACCEPTED';
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            {isAccepted ? (
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            )}
            <CardTitle className="text-2xl">Offer {responseStatus}</CardTitle>
            <CardDescription className="text-base mt-2">
              {isAccepted
                ? 'Congratulations! You have accepted the offer. Our HR team will reach out with your onboarding credentials shortly.'
                : 'You have declined this offer. We appreciate your time and wish you the best in your future endeavors.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Corporate Site
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- MAIN OFFER STATE ---
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-2">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Official Employment Offer
          </h1>
          <p className="text-muted-foreground">
            Please review the details below carefully before making your
            decision.
          </p>
        </div>

        {pageError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>
        )}

        {/* Main Document Card */}
        <Card className="shadow-lg border-t-4 border-t-primary relative">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileSignature className="h-5 w-5 text-primary" />
              <CardTitle>
                Welcome to WorkSphere, {offer?.candidate?.fullName}!
              </CardTitle>
            </div>
            <CardDescription className="text-base text-foreground/80 leading-relaxed">
              We are thrilled to formally offer you the position of{' '}
              <span className="font-semibold text-foreground">
                {offer?.jobOpening?.title}
              </span>{' '}
              in our{' '}
              <span className="font-semibold text-foreground">
                {offer?.jobOpening?.department?.name}
              </span>{' '}
              department. Based on your excellent interviews and qualifications,
              we are confident you will be a great addition to our team.
            </CardDescription>
          </CardHeader>

          <Separator className="my-2" />

          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Core Compensation & Logistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Position Info */}
              <Card className="bg-muted/50 border-none shadow-none">
                <CardContent className="p-4 flex items-start gap-4">
                  <Briefcase className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Position
                    </p>
                    <p className="font-semibold">{offer?.jobOpening?.title}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Department Info */}
              <Card className="bg-muted/50 border-none shadow-none">
                <CardContent className="p-4 flex items-start gap-4">
                  <Building className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Department
                    </p>
                    <p className="font-semibold">
                      {offer?.jobOpening?.department?.name}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Salary Info */}
              <Card className="bg-muted/50 border-none shadow-none">
                <CardContent className="p-4 flex items-start gap-4">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Annual Compensation
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg text-green-600">
                        $
                        {offer?.proposedSalary?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-100"
                      >
                        USD
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Start Date Info */}
              <Card className="bg-muted/50 border-none shadow-none">
                <CardContent className="p-4 flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Expected Start Date
                    </p>
                    <p className="font-semibold">
                      {new Date(offer?.joiningDate).toLocaleDateString(
                        undefined,
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>

          <Separator />

          <CardFooter className="flex flex-col pt-6 pb-8 px-8">
            {submitError && (
              <Alert variant="destructive" className="mb-6 w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Submission Failed</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground text-center mb-6">
              By accepting this offer, you agree to officially join our
              organization. You will immediately be provisioned with your
              employee accounts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button
                size="lg"
                variant="outline"
                className="sm:w-48 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => initiateAction(false)}
                disabled={isSubmitting}
              >
                {isSubmitting && pendingAction === false ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Decline Offer
              </Button>
              <Button
                size="lg"
                className="sm:w-48 shadow-lg shadow-primary/20"
                onClick={() => initiateAction(true)}
                disabled={isSubmitting}
              >
                {isSubmitting && pendingAction === true ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Accept Offer
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* ALERT DIALOG COMPONENT */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction ? 'Accept Offer?' : 'Decline Offer?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction
                ? 'Are you sure you want to accept this position? This will notify our HR department to begin your onboarding process.'
                : 'Are you sure you want to decline this offer? This action cannot be easily undone and will release the position to other candidates.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                pendingAction
                  ? 'bg-primary'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PublicOfferResponse;
