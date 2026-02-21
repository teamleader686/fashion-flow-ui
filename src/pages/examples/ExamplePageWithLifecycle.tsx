/**
 * EXAMPLE: Page with Complete Lifecycle Management
 * 
 * This is a reference implementation showing how to use:
 * - usePageLifecycle for cleanup
 * - useNavigation for state-first navigation
 * - useCleanupEffect for subscriptions
 * - Proper state management
 */

import { useState } from 'react';
import { usePageLifecycle } from '@/hooks/usePageLifecycle';
import { useNavigation } from '@/contexts/NavigationContext';
import { useCleanupEffect, useSubscription } from '@/hooks/useCleanupEffect';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/layout/Layout';

export default function ExamplePageWithLifecycle() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigateTo } = useNavigation();

  // ============================================================================
  // PAGE LIFECYCLE MANAGEMENT
  // ============================================================================
  const { navigateWithState, registerSubscription } = usePageLifecycle({
    onMount: async () => {
      console.log('Page mounted - fetching data');
      await fetchData();
    },
    onUnmount: () => {
      console.log('Page unmounting - cleaning up');
    },
    resetState: () => {
      // Reset all local state on unmount
      setData([]);
      setLoading(true);
    },
  });

  // ============================================================================
  // DATA FETCHING WITH CLEANUP
  // ============================================================================
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from('your_table')
        .select('*')
        .limit(10);

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // REAL-TIME SUBSCRIPTION WITH AUTO-CLEANUP
  // ============================================================================
  useSubscription(() => {
    let channel: any;
    try {
      channel = supabase
        .channel(`example_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'your_table',
          },
          (payload) => {
            console.log('Real-time update:', payload);
            fetchData(); // Refresh data
          }
        )
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in example:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscription for example", e);
    }

    // Return cleanup function
    return () => {
      console.log('Removing real-time channel');
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ============================================================================
  // NAVIGATION WITH STATE UPDATE FIRST
  // ============================================================================
  const handleNavigateToDetail = async (id: string) => {
    // Method 1: Using navigateWithState from usePageLifecycle
    await navigateWithState(
      `/detail/${id}`,
      () => {
        // Update state BEFORE navigation
        console.log('Updating state before navigation');
        // You can update context, localStorage, etc. here
      },
      { state: { fromPage: 'example' } }
    );
  };

  const handleNavigateToProducts = async () => {
    // Method 2: Using navigateTo from NavigationContext
    await navigateTo('/products', {
      beforeNavigate: async () => {
        // Async state updates before navigation
        console.log('Preparing navigation...');
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
      state: { category: 'all' },
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Example Page with Lifecycle</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted"
                onClick={() => handleNavigateToDetail(item.id)}
              >
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}

            <button
              onClick={handleNavigateToProducts}
              className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
            >
              Go to Products
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
