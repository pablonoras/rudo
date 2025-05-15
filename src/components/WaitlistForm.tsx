import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useI18n } from '../lib/i18n/context';
import { supabase } from '../lib/supabase';

const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  box: z.string().optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

const WaitlistForm = () => {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    try {
      setSubmitStatus('loading');
      setErrorMessage('');

      // First, check if the email already exists
      const { data: existingUser } = await supabase
        .from('waitlist')
        .select('id')
        .eq('email', data.email.toLowerCase().trim())
        .single();

      if (existingUser) {
        setErrorMessage(t('email-registered'));
        setSubmitStatus('error');
        return;
      }

      // Insert new record
      const { error } = await supabase
        .from('waitlist')
        .insert({
          email: data.email.toLowerCase().trim(),
          name: data.name.trim(),
          box: data.box?.trim() || null,
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setSubmitStatus('success');
      reset();
    } catch (error: any) {
      console.error('Error details:', error);
      setErrorMessage(t('error-occurred'));
      setSubmitStatus('error');
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-4">
        <div className="mb-4 text-green-400">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">{t('thanks-register')}</h3>
        <p className="text-gray-400">{t('contact-soon')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="space-y-2">
        <input
          type="text"
          placeholder={t('full-name')}
          {...register('name')}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
        />
        {errors.name && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <input
          type="email"
          placeholder={t('email')}
          {...register('email')}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
        />
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <input
          type="text"
          placeholder={t('box-name')}
          {...register('box')}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent text-white placeholder-gray-400"
        />
      </div>

      <button
        type="submit"
        disabled={submitStatus === 'loading'}
        className="group relative w-full inline-flex items-center justify-center"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
        <span className="relative w-full bg-[#0A0A0A]/90 text-white px-8 py-4 rounded-lg font-bold tracking-wide inline-flex items-center justify-center gap-3 border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:bg-[#0A0A0A]/70">
          {submitStatus === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {t('reserve-access')}
              <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={2} />
            </>
          )}
        </span>
      </button>
    </form>
  );
};

export default WaitlistForm; 