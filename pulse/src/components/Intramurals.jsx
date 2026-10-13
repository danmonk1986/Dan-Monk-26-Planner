import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SportsIcon from '@mui/icons-material/Sports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from '../theme';
import supabase from '../lib/supabaseClient';

const SPORT_ICONS = {
  'Indoor Soccer': SportsSoccerIcon,
  'Volleyball': SportsVolleyballIcon,
  'Basketball': SportsBasketballIcon,
  'Badminton': SportsTennisIcon,
};

const DEFAULT_ICON = SportsIcon;

function getSportIcon(name) {
  return SPORT_ICONS[name] || DEFAULT_ICON;
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function Intramurals() {
  const [sports, setSports] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signupDialogSport, setSignupDialogSport] = useState(null);
  const [formData, setFormData] = useState({ player_name: '', player_email: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setError('Database is not configured. Please check your environment setup.');
      setLoading(false);
      return;
    }
    try {
      const { data: sportsData, error: sportsErr } = await supabase
        .from('intramural_sports')
        .select('*')
        .order('name');
      if (sportsErr) throw sportsErr;

      const { data: signupsData, error: signupsErr } = await supabase
        .from('intramural_signups')
        .select('id, sport_id, player_name, player_email');
      if (signupsErr) throw signupsErr;

      setSports(sportsData || []);
      setSignups(signupsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load sports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const signupsBySport = signups.reduce((acc, s) => {
    if (!acc[s.sport_id]) acc[s.sport_id] = [];
    acc[s.sport_id].push(s);
    return acc;
  }, {});

  function handleOpenSignup(sport) {
    setSignupDialogSport(sport);
    setFormData({ player_name: '', player_email: '' });
    setFormError(null);
  }

  function handleCloseSignup() {
    setSignupDialogSport(null);
    setFormError(null);
  }

  async function handleSubmitSignup(e) {
    e.preventDefault();
    if (!signupDialogSport) return;
    setFormError(null);

    const name = formData.player_name.trim();
    const email = formData.player_email.trim();
    if (!name) {
      setFormError('Please enter your name.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const sportSignups = signupsBySport[signupDialogSport.id] || [];
    if (sportSignups.length >= signupDialogSport.max_players) {
      setFormError('This sport is full. Check back later or pick another one.');
      return;
    }

    const alreadySignedUp = sportSignups.some(
      (s) => s.player_email.toLowerCase() === email.toLowerCase()
    );
    if (alreadySignedUp) {
      setFormError("You've already signed up for this sport!");
      return;
    }

    if (!supabase) {
      setFormError('Database is not configured.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: insertErr } = await supabase
        .from('intramural_signups')
        .insert({
          sport_id: signupDialogSport.id,
          player_name: name,
          player_email: email,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setSignups((prev) => [...prev, data]);
      setToast({
        open: true,
        message: `You're signed up for ${signupDialogSport.name}!`,
        severity: 'success',
      });
      handleCloseSignup();
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseToast() {
    setToast((prev) => ({ ...prev, open: false }));
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 3 }}>
          Intramural Sports
        </Typography>
        <LinearProgress sx={{ maxWidth: 300 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading available leagues…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchData}>
          Try again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
          Intramural Sports
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          Browse the leagues below and sign up for any that catch your eye. Spots are limited — first come, first served.
        </Typography>
      </Box>

      {sports.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'primary.light', opacity: 0.4, mb: 2 }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', mb: 1 }}>
            No sports available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back soon for upcoming leagues.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {sports.map((sport) => {
            const Icon = getSportIcon(sport.name);
            const roster = signupsBySport[sport.id] || [];
            const spotsLeft = sport.max_players - roster.length;
            const isFull = spotsLeft <= 0;
            const fillPct = (roster.length / sport.max_players) * 100;

            return (
              <Box
                key={sport.id}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
                }}
              >
                <Card id={`sport-card-${sport.id}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Icon sx={{ color: 'primary.light', fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                        {sport.name}
                      </Typography>
                    </Box>

                    {/* Description */}
                    {sport.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5, fontSize: '0.82rem' }}>
                        {sport.description}
                      </Typography>
                    )}

                    {/* Meta chips */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                      <Chip
                        icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
                        label={sport.day_of_week}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', borderColor: tokens.borderViolet, color: 'text.secondary', height: 24 }}
                      />
                      {sport.location && (
                        <Chip
                          icon={<PlaceIcon sx={{ fontSize: 14 }} />}
                          label={sport.location}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', borderColor: tokens.borderViolet, color: 'text.secondary', height: 24 }}
                        />
                      )}
                      <Chip
                        label={`${formatDate(sport.start_date)} – ${formatDate(sport.end_date)}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', borderColor: tokens.borderViolet, color: 'text.secondary', height: 24 }}
                      />
                    </Box>

                    {/* Roster progress */}
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {roster.length} / {sport.max_players} signed up
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: isFull ? '#FBBF24' : '#4ADE80', fontWeight: 600 }}>
                          {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={fillPct}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: tokens.accentDim12,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: isFull ? '#FBBF24' : tokens.violetBright,
                          },
                        }}
                      />

                      <Button
                        variant={isFull ? 'outlined' : 'contained'}
                        size="small"
                        fullWidth
                        disabled={isFull}
                        onClick={() => handleOpenSignup(sport)}
                        id={`signup-button-${sport.id}`}
                        sx={{ mt: 2 }}
                      >
                        {isFull ? 'Roster Full' : 'Sign Up'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Sign-up dialog */}
      <Dialog
        open={!!signupDialogSport}
        onClose={handleCloseSignup}
        maxWidth="xs"
        fullWidth
        id="signup-dialog"
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '1rem', pr: 6 }}>
          {signupDialogSport ? `Sign Up — ${signupDialogSport.name}` : ''}
          <IconButton
            onClick={handleCloseSignup}
            aria-label="Close"
            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent component="form" onSubmit={handleSubmitSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {formError && (
            <Alert severity="error" sx={{ fontSize: '0.85rem' }}>
              {formError}
            </Alert>
          )}
          <TextField
            label="Your name"
            value={formData.player_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, player_name: e.target.value }))}
            required
            fullWidth
            autoFocus
            id="signup-name-input"
            placeholder="e.g. Alex Chen"
          />
          <TextField
            label="Email address"
            type="email"
            value={formData.player_email}
            onChange={(e) => setFormData((prev) => ({ ...prev, player_email: e.target.value }))}
            required
            fullWidth
            id="signup-email-input"
            placeholder="e.g. alex@example.com"
          />
          {signupDialogSport && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {signupDialogSport.day_of_week} at {signupDialogSport.location} · {formatDate(signupDialogSport.start_date)} – {formatDate(signupDialogSport.end_date)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseSignup} size="medium">
            Cancel
          </Button>
          <Button
            variant="contained"
            size="medium"
            disabled={submitting}
            onClick={handleSubmitSignup}
            id="signup-submit-button"
          >
            {submitting ? 'Signing up…' : 'Confirm Sign-Up'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
