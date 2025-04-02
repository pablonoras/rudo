import { AlertCircle } from 'lucide-react';

const RoleInfo = () => {
  return (
    <div className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <p className="text-gray-300 text-sm">
            Each account can only have one role in the system. Once you sign up as a coach or athlete, 
            you cannot switch roles without creating a new account with a different email address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleInfo; 