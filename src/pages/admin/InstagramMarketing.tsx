import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstagramUsersTab from '@/components/admin/instagram/InstagramUsersTab';
import CampaignsTab from '@/components/admin/instagram/CampaignsTab';
import AssignmentsTab from '@/components/admin/instagram/AssignmentsTab';
import CoinsManagementTab from '@/components/admin/instagram/CoinsManagementTab';
import InstagramAnalyticsDashboard from '@/components/admin/instagram/InstagramAnalyticsDashboard';
import { Instagram, Users, FileImage, Award, BarChart3 } from 'lucide-react';

export default function InstagramMarketing() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
            <Instagram className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Instagram Marketing</h1>
            <p className="text-muted-foreground">Manage influencers, campaigns, and rewards</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto">
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 text-xs md:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2 text-xs md:text-sm">
              <FileImage className="w-4 h-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2 text-xs md:text-sm">
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="coins" className="flex items-center gap-2 text-xs md:text-sm">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Coins</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6"><InstagramAnalyticsDashboard /></TabsContent>
          <TabsContent value="users" className="mt-6"><InstagramUsersTab /></TabsContent>
          <TabsContent value="campaigns" className="mt-6"><CampaignsTab /></TabsContent>
          <TabsContent value="assignments" className="mt-6"><AssignmentsTab /></TabsContent>
          <TabsContent value="coins" className="mt-6"><CoinsManagementTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
