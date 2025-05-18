import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Clock,
  FileSpreadsheet,
  MessageCircle,
  MessageSquare,
  Palette,
  Plus,
  Smartphone,
  Star,
  User, UserCog,
  Users,
  UsersRound
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';
import Footer from './Footer';
import Header from './Header';
import Modal from './Modal';
import WaitlistForm from './WaitlistForm';

// Define a type for translation keys to ensure type safety
type TranslationKey = Parameters<ReturnType<typeof useI18n>['t']>[0];

const TestimonialCard = ({ quoteKey, nameKey, roleKey }: {
  quoteKey: string;
  nameKey: string;
  roleKey: string;
}) => {
  const { t } = useI18n();
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="relative p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-[#8A2BE2]/30 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2]/10 to-[#4169E1]/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity" />
      <div className="relative">
        <Star className="w-6 h-6 text-[#8A2BE2] mb-4" />
        <p className="text-lg mb-4 text-gray-300">{t(quoteKey as TranslationKey)}</p>
        <div>
          <p className="font-bold">{t(nameKey as TranslationKey)}</p>
          <p className="text-sm text-gray-400">{t(roleKey as TranslationKey)}</p>
        </div>
      </div>
    </motion.div>
  );
};

const ComparisonRow = ({ problem, solution, icon: Icon, problemSubtext, solutionSubtext }: {
  problem: string;
  solution: string;
  icon: React.ElementType;
  problemSubtext: string;
  solutionSubtext: string;
}) => {
  const { t } = useI18n();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid md:grid-cols-2 gap-6 mb-8"
    >
      <motion.div 
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="group p-6 bg-gradient-to-br from-red-500/5 to-red-900/5 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-all duration-300"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <Icon className="w-6 h-6 text-red-400" />
              </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-gray-200">{t(problem as TranslationKey)}</h3>
            <p className="text-gray-400">{t(problemSubtext as TranslationKey)}</p>
              </div>
            </div>
      </motion.div>
      
      <motion.div 
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="group p-6 bg-gradient-to-br from-[#8A2BE2]/10 to-[#4169E1]/10 rounded-2xl border border-[#8A2BE2]/20 hover:border-[#8A2BE2]/30 transition-all duration-300"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#8A2BE2]/20 rounded-xl">
            <Icon className="w-6 h-6 text-[#8A2BE2]" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">{t(solution as TranslationKey)}</h3>
            <p className="text-gray-400">{t(solutionSubtext as TranslationKey)}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FAQItem = ({ questionKey, answerKey }: { questionKey: string; answerKey: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  return (
    <motion.div 
      initial={false}
      animate={{ backgroundColor: isOpen ? "rgba(255, 255, 255, 0.03)" : "transparent" }}
      className="rounded-xl transition-colors duration-200"
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left group"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <span className="text-lg font-medium pr-8 group-hover:text-[#8A2BE2] transition-colors duration-200">
          {t(questionKey as TranslationKey)}
        </span>
        <motion.div
          initial={false}
          animate={{ 
            rotate: isOpen ? 45 : 0,
            backgroundColor: isOpen ? "rgb(138, 43, 226)" : "rgba(255, 255, 255, 0.1)"
          }}
          className="p-1 rounded-lg"
        >
          <Plus className={`w-4 h-4 transition-colors duration-200 ${isOpen ? "text-white" : "text-gray-400"}`} />
        </motion.div>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: "auto", 
              opacity: 1,
              transition: { 
                height: { type: "spring", stiffness: 400, damping: 17 },
                opacity: { duration: 0.2 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { type: "spring", stiffness: 400, damping: 17 },
                opacity: { duration: 0.2 }
              }
            }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-400 leading-relaxed">{t(answerKey as TranslationKey)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8A2BE2] rounded-full filter blur-[128px] opacity-20 transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4169E1] rounded-full filter blur-[128px] opacity-20 transform -translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-40 sm:pb-32">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] sm:leading-none mb-6 px-4"
              >
                {t('new-slogan-line1' as TranslationKey)}
                <br />
                <span className="bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] bg-clip-text text-transparent">
                  {t('new-slogan-line2' as TranslationKey)}
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto text-lg sm:text-xl md:text-2xl text-gray-400 mb-10 px-4"
              >
                {t('hero-description')}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center px-4"
              >
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="group relative inline-flex items-center justify-center w-full sm:w-auto"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                  <span className="relative px-8 py-4 bg-[#0A0A0A] text-white rounded-full font-bold tracking-wide flex items-center justify-center gap-3 border border-white/10 hover:border-white/20 transition-all duration-500 w-full sm:w-auto">
                    {t('join-beta')}
                    <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Product Preview Section */}
        <div className="py-24 bg-black/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('programming-simplified')}</h2>
              <p className="text-xl text-gray-400">
                {t('platform-preview')}
              </p>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2]/10 to-[#4169E1]/10" />
              <img 
                src="https://i.ibb.co/pB61s01x/platform.jpg"
                alt="RUDO Platform Interface"
                className="w-full h-auto relative z-10"
              />
        </div>
      </div>
    </div>

        {/* Social Proof Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t('coaches-feedback')}
              </h2>
              <p className="text-xl text-gray-400">
                {t('coaches-trust')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard
                quoteKey="testimonial-1-quote"
                nameKey="testimonial-1-name"
                roleKey="testimonial-1-role"
              />
              <TestimonialCard
                quoteKey="testimonial-2-quote"
                nameKey="testimonial-2-name"
                roleKey="testimonial-2-role"
              />
              <TestimonialCard
                quoteKey="testimonial-3-quote"
                nameKey="testimonial-3-name"
                roleKey="testimonial-3-role"
              />
            </div>
          </div>
        </div>

        {/* Why Coaches Are Switching Section */}
        <div id="why-coaches" className="py-24 bg-black/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t('why-switch')}
              </h2>
              <p className="text-xl text-gray-400">
                {t('chaos-control')}
              </p>
      </div>
      
            <div className="space-y-6">
              <ComparisonRow
                problem="spreadsheet-problem"
                solution="spreadsheet-solution"
                problemSubtext="spreadsheet-problem-subtext"
                solutionSubtext="spreadsheet-solution-subtext"
                icon={FileSpreadsheet}
              />
              
              <ComparisonRow
                problem="copy-paste-problem"
                solution="copy-paste-solution"
                problemSubtext="copy-paste-problem-subtext"
                solutionSubtext="copy-paste-solution-subtext"
                icon={UsersRound}
              />
              
              <ComparisonRow
                problem="feedback-problem"
                solution="feedback-solution"
                problemSubtext="feedback-problem-subtext"
                solutionSubtext="feedback-solution-subtext"
                icon={MessageCircle}
              />
              
              <ComparisonRow
                problem="branding-problem"
                solution="branding-solution"
                problemSubtext="branding-problem-subtext"
                solutionSubtext="branding-solution-subtext"
                icon={Palette}
              />
            </div>
          </div>
      </div>

        {/* Coach vs Athlete Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t('both-sides')}
              </h2>
                </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#8A2BE2]/20 rounded-xl">
                    <UserCog className="w-6 h-6 text-[#8A2BE2]" />
                  </div>
                  <h3 className="text-2xl font-bold">{t('coach-features-title')}</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#8A2BE2]" />
                    <span>{t('save-time')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#8A2BE2]" />
                    <span>{t('manage-groups')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-[#8A2BE2]" />
                    <span>{t('look-pro')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 text-[#8A2BE2] font-medium hover:underline"
                  >
                    {t('get-started')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#4169E1]/20 rounded-xl">
                    <User className="w-6 h-6 text-[#4169E1]" />
                  </div>
                  <h3 className="text-2xl font-bold">{t('athlete-features-title')}</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#4169E1]" />
                    <span>{t('access-workouts')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#4169E1]" />
                    <span>{t('instant-feedback')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-[#4169E1]" />
                    <span>{t('track-progress')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 text-[#4169E1] font-medium hover:underline"
                  >
                    {t('get-started')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="py-24 bg-black/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t('still-questions')}
              </h2>
            </div>
            
            <div className="space-y-4">
              <FAQItem
                questionKey="faq-1-question"
                answerKey="faq-1-answer"
              />
              <FAQItem
                questionKey="faq-2-question"
                answerKey="faq-2-answer"
              />
              <FAQItem
                questionKey="faq-3-question"
                answerKey="faq-3-answer"
              />
              <FAQItem
                questionKey="faq-4-question"
                answerKey="faq-4-answer"
              />
              <FAQItem
                questionKey="faq-5-question"
                answerKey="faq-5-answer"
              />
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-24 bg-gradient-to-b from-transparent to-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('ready-to-pro')}
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              {t('shape-future')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="group relative inline-flex items-center justify-center mx-auto w-full sm:w-auto"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4169E1] to-[#8A2BE2] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                <span className="relative px-8 py-4 bg-[#0A0A0A] text-white rounded-full font-bold tracking-wide flex items-center gap-3 border border-white/10 hover:border-white/20 transition-all duration-500 w-full sm:w-auto">
                  {t('get-started')}
                  <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </Link>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative inline-flex items-center justify-center mx-auto w-full sm:w-auto"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                <span className="relative px-8 py-4 bg-[#0A0A0A] text-white rounded-full font-bold tracking-wide flex items-center gap-3 border border-white/10 hover:border-white/20 transition-all duration-500 w-full sm:w-auto">
                  {t('request-access')}
                  <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mt-6">
              {t('trusted-by')}
            </p>
          </div>
        </div>

        <Footer />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{t('join-beta-title')}</h2>
          <p className="text-gray-400">{t('join-beta-subtitle')}</p>
    </div>
        <WaitlistForm />
      </Modal>
    </>
  );
};

export default LandingPage;