/**
 * src/components/debug/InviteCodeDebug.tsx
 * 
 * Debug component to view and test coach invite codes.
 * Only for development use.
 */

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Coach {
  id: string;
  full_name: string;
  invite_code: string | null;
}

const InviteCodeDebug = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, invite_code')
          .eq('role', 'coach');

        if (error) throw error;
        setCoaches(data || []);
      } catch (err: any) {
        console.error('Error fetching coaches:', err);
        setError(err.message || 'Failed to load coaches');
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  const testInviteCode = async () => {
    if (!testCode.trim()) return;
    
    try {
      setTestLoading(true);
      setTestResult(null);
      
      // Direct query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('invite_code', testCode)
        .eq('role', 'coach');
      
      // RPC call
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_coach_by_invite_code', {
        code: testCode
      });
      
      // Case insensitive search
      const { data: allCoaches } = await supabase
        .from('profiles')
        .select('id, full_name, invite_code')
        .eq('role', 'coach');
      
      const matchingCoach = allCoaches?.find(coach => 
        coach.invite_code && coach.invite_code.toLowerCase() === testCode.toLowerCase()
      );
      
      setTestResult({
        code: testCode,
        directQuery: {
          data: profileData,
          error: profileError
        },
        rpcResult: {
          data: rpcData,
          error: rpcError
        },
        caseInsensitiveMatch: matchingCoach || null
      });
    } catch (err: any) {
      console.error('Error testing invite code:', err);
      setTestResult({
        error: err.message || 'An error occurred during testing'
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Invite Code Debugging</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Test Invite Code</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            placeholder="Enter invite code to test"
            className="px-3 py-2 border rounded flex-1"
          />
          <button
            onClick={testInviteCode}
            disabled={testLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {testLoading ? 'Testing...' : 'Test'}
          </button>
        </div>
        
        {testResult && (
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <h3 className="font-semibold mb-2">Test Results for: {testResult.code}</h3>
            
            <div className="mb-3">
              <h4 className="font-medium">Direct Query:</h4>
              <pre className="bg-white p-2 rounded text-sm">
                {JSON.stringify(testResult.directQuery, null, 2)}
              </pre>
            </div>
            
            <div className="mb-3">
              <h4 className="font-medium">RPC Result:</h4>
              <pre className="bg-white p-2 rounded text-sm">
                {JSON.stringify(testResult.rpcResult, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium">Case Insensitive Match:</h4>
              <pre className="bg-white p-2 rounded text-sm">
                {JSON.stringify(testResult.caseInsensitiveMatch, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-3">Available Coach Invite Codes</h2>
        
        {loading ? (
          <p>Loading coaches...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Coach Name</th>
                  <th className="py-2 px-4 border">Invite Code</th>
                  <th className="py-2 px-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center">No coaches found</td>
                  </tr>
                ) : (
                  coaches.map((coach) => (
                    <tr key={coach.id}>
                      <td className="py-2 px-4 border">{coach.full_name}</td>
                      <td className="py-2 px-4 border font-mono">
                        {coach.invite_code || <span className="text-gray-400">None</span>}
                      </td>
                      <td className="py-2 px-4 border">
                        {coach.invite_code && (
                          <button
                            onClick={() => {
                              setTestCode(coach.invite_code || '');
                              window.scrollTo(0, 0);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            Test
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteCodeDebug; 