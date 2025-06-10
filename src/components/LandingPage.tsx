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
      className="relative p-6 bg-white/10 rounded-2xl border border-white/20 hover:border-[#8A2BE2]/40 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2]/20 to-[#4169E1]/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <Star className="w-6 h-6 text-[#8A2BE2] mb-4" />
        <p className="text-lg mb-4 text-gray-200 leading-relaxed">{t(quoteKey as TranslationKey)}</p>
        <div>
          <p className="font-bold text-white">{t(nameKey as TranslationKey)}</p>
          <p className="text-sm text-gray-300">{t(roleKey as TranslationKey)}</p>
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
      className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8"
    >
      <motion.div 
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="group p-4 md:p-6 bg-gradient-to-br from-red-500/10 to-red-900/10 rounded-xl md:rounded-2xl border border-red-500/20 hover:border-red-500/30 transition-all duration-300"
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-red-500/20 rounded-lg md:rounded-xl">
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
              </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-100">{t(problem as TranslationKey)}</h3>
            <p className="text-gray-300 text-sm md:text-base">{t(problemSubtext as TranslationKey)}</p>
              </div>
            </div>
      </motion.div>
      
      <motion.div 
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="group p-4 md:p-6 bg-gradient-to-br from-[#8A2BE2]/15 to-[#4169E1]/15 rounded-xl md:rounded-2xl border border-[#8A2BE2]/30 hover:border-[#8A2BE2]/40 transition-all duration-300"
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-[#8A2BE2]/30 rounded-lg md:rounded-xl">
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#8A2BE2]" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-white">{t(solution as TranslationKey)}</h3>
            <p className="text-gray-300 text-sm md:text-base">{t(solutionSubtext as TranslationKey)}</p>
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
      animate={{ backgroundColor: isOpen ? "rgba(255, 255, 255, 0.05)" : "transparent" }}
      className="rounded-xl transition-colors duration-200 border border-white/10"
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 md:px-6 py-4 md:py-5 flex items-center justify-between text-left group"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <span className="text-base md:text-lg font-medium pr-4 md:pr-8 group-hover:text-[#8A2BE2] transition-colors duration-200 text-white">
          {t(questionKey as TranslationKey)}
        </span>
        <motion.div
          initial={false}
          animate={{ 
            rotate: isOpen ? 45 : 0,
            backgroundColor: isOpen ? "rgb(138, 43, 226)" : "rgba(255, 255, 255, 0.15)"
          }}
          className="p-1.5 md:p-2 rounded-lg"
        >
          <Plus className={`w-4 h-4 transition-colors duration-200 ${isOpen ? "text-white" : "text-gray-300"}`} />
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
            <p className="px-4 md:px-6 pb-4 md:pb-5 text-gray-200 leading-relaxed text-sm md:text-base">{t(answerKey as TranslationKey)}</p>
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
            <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#8A2BE2] rounded-full filter blur-[64px] md:blur-[128px] opacity-20 transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#4169E1] rounded-full filter blur-[64px] md:blur-[128px] opacity-20 transform -translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16 md:pb-20 sm:pt-32 md:sm:pt-40 sm:pb-24 md:sm:pb-32">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.1] sm:leading-none mb-6 px-2"
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
                className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-8 md:mb-10 px-4 leading-relaxed"
              >
                {t('hero-description')}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-4 justify-center px-4 max-w-md mx-auto"
              >
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="group relative w-full"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                  <span className="relative px-8 py-4 md:py-5 bg-[#0A0A0A] text-white rounded-2xl font-bold tracking-wide flex items-center justify-center gap-3 border border-white/20 hover:border-white/30 transition-all duration-500 text-base md:text-lg">
                    {t('join-beta')}
                    <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Product Preview Section */}
        <div className="py-16 md:py-24 bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">{t('programming-simplified')}</h2>
              <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
                {t('platform-preview')}
              </p>
            </div>
            
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2]/20 to-[#4169E1]/20" />
              <img 
                src="https://i.ibb.co/pB61s01x/platform.jpg"
                alt="RUDO Platform Interface"
                className="w-full h-auto relative z-10"
              />
        </div>
      </div>
    </div>

        {/* Social Proof Section */}
        <div className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
                {t('coaches-feedback')}
              </h2>
              <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
                {t('coaches-trust')}
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <div id="why-coaches" className="py-16 md:py-24 bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
                {t('why-switch')}
              </h2>
              <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
                {t('chaos-control')}
              </p>
      </div>
      
            <div className="space-y-4 md:space-y-6">
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
        <div className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
                {t('both-sides')}
              </h2>
                </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-6 md:p-8 bg-white/10 rounded-xl md:rounded-2xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 md:p-3 bg-[#8A2BE2]/30 rounded-lg md:rounded-xl">
                    <UserCog className="w-5 h-5 md:w-6 md:h-6 text-[#8A2BE2]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">{t('coach-features-title')}</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#8A2BE2]" />
                    <span className="text-gray-200">{t('save-time')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#8A2BE2]" />
                    <span className="text-gray-200">{t('manage-groups')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-[#8A2BE2]" />
                    <span className="text-gray-200">{t('look-pro')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/30 text-[#8A2BE2] rounded-lg font-semibold transition-all duration-200 border border-[#8A2BE2]/30"
                  >
                    {t('get-started')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white/10 rounded-xl md:rounded-2xl border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 md:p-3 bg-[#4169E1]/30 rounded-lg md:rounded-xl">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-[#4169E1]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">{t('athlete-features-title')}</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#4169E1]" />
                    <span className="text-gray-200">{t('access-workouts')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#4169E1]" />
                    <span className="text-gray-200">{t('instant-feedback')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-[#4169E1]" />
                    <span className="text-gray-200">{t('track-progress')}</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#4169E1]/20 hover:bg-[#4169E1]/30 text-[#4169E1] rounded-lg font-semibold transition-all duration-200 border border-[#4169E1]/30"
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
        <div id="faq" className="py-16 md:py-24 bg-black/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
                {t('still-questions')}
              </h2>
            </div>
            
            <div className="space-y-3 md:space-y-4">
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
        <div className="py-16 md:py-24 bg-gradient-to-b from-transparent to-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('ready-to-pro')}
            </h2>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              {t('shape-future')}
            </p>
            
            <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
              <Link
                to="/auth"
                className="group relative w-full"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4169E1] to-[#8A2BE2] rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                <span className="relative px-8 py-4 md:py-5 bg-[#0A0A0A] text-white rounded-2xl font-bold tracking-wide flex items-center justify-center gap-3 border border-white/20 hover:border-white/30 transition-all duration-500 text-base md:text-lg">
                  {t('get-started')}
                  <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </Link>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative w-full"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                <span className="relative px-8 py-4 md:py-5 bg-[#0A0A0A] text-white rounded-2xl font-bold tracking-wide flex items-center justify-center gap-3 border border-white/20 hover:border-white/30 transition-all duration-500 text-base md:text-lg">
                  {t('request-access')}
                  <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
            
            <p className="text-sm text-gray-300 mt-6">
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