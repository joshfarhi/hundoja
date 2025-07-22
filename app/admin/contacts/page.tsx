'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Mail,
  Search,
  Eye,
  Reply,
  Archive,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
  Phone,
  ChevronDown,
} from 'lucide-react';

const contacts = [
  {
    id: 'CT-001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    subject: 'Question about sizing',
    message: 'Hi, I\'m interested in the Shadow Oversized Hoodie but I\'m not sure about the sizing. Could you help me with the measurements for size Large?',
    status: 'new',
    priority: 'normal',
    category: 'product_inquiry',
    submittedAt: '2024-01-16T14:30:00Z',
    respondedAt: null,
    tags: ['sizing', 'hoodie'],
  },
  {
    id: 'CT-002',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 987-6543',
    subject: 'Order delivery issue',
    message: 'My order #ORD-123 was supposed to arrive yesterday but I haven\'t received it yet. Can you please check the status? The tracking number seems to be invalid.',
    status: 'in_progress',
    priority: 'high',
    category: 'order_support',
    submittedAt: '2024-01-15T09:15:00Z',
    respondedAt: '2024-01-15T11:30:00Z',
    tags: ['delivery', 'tracking', 'urgent'],
  },
  {
    id: 'CT-003',
    name: 'Mike Davis',
    email: 'mike.davis@example.com',
    phone: null,
    subject: 'Wholesale inquiry',
    message: 'Hello, I run a boutique store in downtown LA and I\'m interested in carrying your brand. Could we discuss wholesale pricing and minimum order quantities?',
    status: 'resolved',
    priority: 'high',
    category: 'business',
    submittedAt: '2024-01-14T16:45:00Z',
    respondedAt: '2024-01-14T18:20:00Z',
    tags: ['wholesale', 'business', 'partnership'],
  },
  {
    id: 'CT-004',
    name: 'Emily Chen',
    email: 'emily.chen@example.com',
    phone: '+1 (555) 456-7890',
    subject: 'Return request',
    message: 'I received the Urban Cargo Pants but they don\'t fit properly. I\'d like to return them and get a refund. The item is still in original packaging.',
    status: 'new',
    priority: 'normal',
    category: 'returns',
    submittedAt: '2024-01-16T11:20:00Z',
    respondedAt: null,
    tags: ['return', 'refund', 'pants'],
  },
  {
    id: 'CT-005',
    name: 'Alex Thompson',
    email: 'alex.t@example.com',
    phone: '+1 (555) 234-5678',
    subject: 'Website feedback',
    message: 'I love the new website design! However, I noticed that the search function is a bit slow on mobile devices. Thought you might want to know.',
    status: 'resolved',
    priority: 'low',
    category: 'feedback',
    submittedAt: '2024-01-13T13:10:00Z',
    respondedAt: '2024-01-13T15:45:00Z',
    tags: ['website', 'mobile', 'performance'],
  },
];

const statusConfig = {
  new: { label: 'New', icon: AlertCircle, color: 'text-blue-400 bg-blue-500/20' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-yellow-400 bg-yellow-500/20' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-green-400 bg-green-500/20' },
  closed: { label: 'Closed', icon: Archive, color: 'text-neutral-400 bg-neutral-500/20' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-green-400' },
  normal: { label: 'Normal', color: 'text-blue-400' },
  high: { label: 'High', color: 'text-red-400' },
  urgent: { label: 'Urgent', color: 'text-red-500' },
};

const categoryConfig = {
  product_inquiry: { label: 'Product Inquiry', icon: MessageSquare },
  order_support: { label: 'Order Support', icon: Archive },
  returns: { label: 'Returns', icon: Reply },
  business: { label: 'Business', icon: User },
  feedback: { label: 'Feedback', icon: Star },
  technical: { label: 'Technical', icon: AlertCircle },
};

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || contact.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || contact.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseTime = (submittedAt: string, respondedAt: string | null) => {
    if (!respondedAt) return null;
    const submitted = new Date(submittedAt);
    const responded = new Date(respondedAt);
    const diffHours = Math.round((responded.getTime() - submitted.getTime()) / (1000 * 60 * 60));
    return `${diffHours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Contact Requests</h1>
          <p className="text-neutral-400 mt-1">Manage customer inquiries and support requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            className={cn(
              "flex items-center space-x-2 px-4 py-2",
              "bg-neutral-800 border border-white/10 text-white rounded-lg",
              "hover:bg-neutral-700 transition-all duration-200"
            )}
            whileHover={{ scale: 1.02 }}
          >
            <Archive size={16} />
            <span>Archive Selected</span>
          </motion.button>
          <motion.button
            className={cn(
              "flex items-center space-x-2 px-4 py-2",
              "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg",
              "hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
            )}
            whileHover={{ scale: 1.02 }}
          >
            <Reply size={16} />
            <span>Bulk Reply</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Requests', value: contacts.length, icon: Mail, color: 'from-blue-500 to-cyan-500' },
          { title: 'New', value: contacts.filter(c => c.status === 'new').length, icon: AlertCircle, color: 'from-blue-500 to-indigo-500' },
          { title: 'In Progress', value: contacts.filter(c => c.status === 'in_progress').length, icon: Clock, color: 'from-yellow-500 to-orange-500' },
          { title: 'Resolved', value: contacts.filter(c => c.status === 'resolved').length, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "p-4 rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
              "border border-white/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", stat.color, "bg-opacity-20")}>
                <stat.icon className="text-white" size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, subject, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-neutral-800/50 border border-white/10",
              "rounded-lg text-white placeholder-neutral-400",
              "focus:outline-none focus:border-cyan-500/50",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                "appearance-none px-4 py-3 pr-10 bg-neutral-800/50 border border-white/10",
                "rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              )}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
          </div>

          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={cn(
                "appearance-none px-4 py-3 pr-10 bg-neutral-800/50 border border-white/10",
                "rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              )}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={cn(
                "appearance-none px-4 py-3 pr-10 bg-neutral-800/50 border border-white/10",
                "rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              )}
            >
              <option value="all">All Categories</option>
              <option value="product_inquiry">Product Inquiry</option>
              <option value="order_support">Order Support</option>
              <option value="returns">Returns</option>
              <option value="business">Business</option>
              <option value="feedback">Feedback</option>
              <option value="technical">Technical</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
          </div>
        </div>
      </motion.div>

      {/* Contacts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
          "border border-white/10 overflow-hidden"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="text-left p-4 text-neutral-300 font-medium">Contact</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Subject</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Category</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Priority</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Status</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Date</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Response Time</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => {
                const statusInfo = statusConfig[contact.status];
                const StatusIcon = statusInfo.icon;
                const categoryInfo = categoryConfig[contact.category];
                const CategoryIcon = categoryInfo.icon;
                const priorityInfo = priorityConfig[contact.priority];
                
                return (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{contact.name}</div>
                          <div className="text-neutral-400 text-sm">{contact.email}</div>
                          {contact.phone && (
                            <div className="text-neutral-500 text-xs flex items-center">
                              <Phone size={10} className="mr-1" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium max-w-xs truncate">{contact.subject}</div>
                      <div className="text-neutral-400 text-sm font-mono">{contact.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2 text-neutral-300">
                        <CategoryIcon size={16} />
                        <span className="text-sm">{categoryInfo.label}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn("text-sm font-medium", priorityInfo.color)}>
                        {priorityInfo.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className={cn(
                        "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium w-fit",
                        statusInfo.color
                      )}>
                        <StatusIcon size={14} />
                        <span>{statusInfo.label}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-400 text-sm">
                      {formatDate(contact.submittedAt)}
                    </td>
                    <td className="p-4 text-neutral-400 text-sm">
                      {contact.respondedAt ? (
                        <span className="text-green-400">
                          {getResponseTime(contact.submittedAt, contact.respondedAt)}
                        </span>
                      ) : (
                        <span className="text-yellow-400">Pending</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          title="View Details"
                        >
                          <Eye className="text-neutral-400" size={16} />
                        </motion.button>
                        <motion.button
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          title="Reply"
                        >
                          <Reply className="text-neutral-400" size={16} />
                        </motion.button>
                        <motion.button
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          title="Archive"
                        >
                          <Archive className="text-neutral-400" size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto text-neutral-600 mb-4" size={48} />
            <p className="text-neutral-400 text-lg">No contact requests found</p>
            <p className="text-neutral-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}