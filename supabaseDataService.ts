// Stage 4.3: Supabase Data Service Implementation
// Implements IDataService interface for Supabase backend

import { supabaseService, supabase } from './supabaseService';
import {
  FamilyMember,
  NewFamilyMember,
  Chore,
  NewChore,
  EventItem,
  Reward,
  NewReward,
  FamilyDetails,
  ChoreType,
  Routine,
  DailyRoutineProgress,
  TabId
} from './types';

export class SupabaseDataService {
  private isInitialized = false;
  private currentFamilyId: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('SupabaseDataService already initialized.');
      return;
    }

    console.log('🔧 Initializing SupabaseDataService...');
    try {
      const userResult = await supabaseService.getCurrentUser();
      if (!userResult || !userResult.user) {
        // User might be new or auth state not yet fully propagated.
        // Proceed with initialization but without family context yet.
        console.warn('⚠️ User not authenticated during initial SupabaseDataService.initialize(). This might be normal for new user setup.');
        this.currentFamilyId = null;
      } else {
        // User is authenticated, try to get families.
        const familiesResult = await supabaseService.getUserFamilies();
        if (familiesResult.success && familiesResult.families && familiesResult.families.length > 0) {
          this.currentFamilyId = familiesResult.families[0].family.id;
          console.log('👨‍👩‍👧‍👦 Set current family:', familiesResult.families[0].family.name);
        } else {
          // User has no families yet, or failed to fetch them.
          // This is okay during initial setup.
          console.warn('⚠️ User has no families or failed to fetch them during initialize. Family creation may be required.');
          this.currentFamilyId = null;
        }
      }
      
      this.isInitialized = true;
      console.log('✅ SupabaseDataService initialized');

    } catch (error) {
      // Log error but still mark as initialized to allow app to proceed,
      // especially during setup flows where family/user might not exist yet.
      console.error('❌ Error during SupabaseDataService initialization, but proceeding:', error);
      this.isInitialized = true; 
      this.currentFamilyId = null;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SupabaseDataService not initialized');
    }
  }

  private ensureFamilyContext(): string {
    this.ensureInitialized();
    if (!this.currentFamilyId) {
      throw new Error('No family context available');
    }
    return this.currentFamilyId;
  }

  // Family Management
  async getFamilyDetails(): Promise<FamilyDetails> {
    this.ensureInitialized();
    try {
      if (!this.currentFamilyId) {
        // Return default family details if no family context
        return {
          id: 'temp',
          name: 'My Family',
          address: '',
          photoObjectPosition: 'center center',
          inviteCode: 'TEMP-CODE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      // Use Supabase Table API
      const { data, error } = await supabase
        .from('families')
        .select('id, name, address, photo_object_position, invite_code, created_at, updated_at')
        .eq('id', this.currentFamilyId)
        .single();
      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          name: data.name || 'My Family',
          address: data.address || '',
          photoObjectPosition: data.photo_object_position || 'center center',
          inviteCode: data.invite_code || 'NO-CODE',
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        };
      }
      // Fallback to default
      return {
        id: 'temp',
        name: 'My Family',
        address: '',
        photoObjectPosition: 'center center',
        inviteCode: 'NO-CODE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting family details:', error);
      throw error;
    }
  }

  async saveFamilyDetails(details: FamilyDetails): Promise<void> {
    const familyId = this.ensureFamilyContext();
    try {
      const { error } = await supabase
        .from('families')
        .update({
          name: details.name,
          address: details.address,
          photo_object_position: details.photoObjectPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyId);
      if (error) throw error;
      console.log('✅ Family details saved to Supabase');
    } catch (error) {
      console.error('Error saving family details:', error);
      throw error;
    }
  }

  async getFamilyPhoto(): Promise<string | null> {
    const familyId = this.ensureFamilyContext();
    try {
      const { data, error } = await supabase
        .from('families')
        .select('photo_url')
        .eq('id', familyId)
        .single();
      if (error) throw error;
      return data && data.photo_url ? data.photo_url : null;
    } catch (error) {
      console.error('Error getting family photo:', error);
      return null;
    }
  }

  async saveFamilyPhoto(photoDataUrl: string): Promise<void> {
    const familyId = this.ensureFamilyContext();
    try {
      const { error } = await supabase
        .from('families')
        .update({
          photo_url: photoDataUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyId);
      if (error) throw error;
      console.log('✅ Family photo saved to Supabase');
    } catch (error) {
      console.error('Error saving family photo:', error);
      throw error;
    }
  }

  // Family Members - TODO: Need to implement these tables in Supabase
  async getFamilyMembers(): Promise<FamilyMember[]> {
    const familyId = this.ensureFamilyContext();
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name,
        initial: row.initial,
        role: row.role,
        color: row.color,
        nickname: row.nickname,
        dob: row.dob,
        points: row.points || 0,
        created_at: row.created_at
      }));
    } catch (error) {
      console.error('Error getting family members:', error);
      return [];
    }
  }

  async addFamilyMember(member: NewFamilyMember): Promise<FamilyMember> {
    const familyId = this.ensureFamilyContext();
    try {
      // Only allow roles permitted by the DB constraint
      const allowedRoles = ['Mum', 'Dad', 'Child', 'Teen', 'Grandma', 'Grandad', 'Pet', 'Other'];
      let roleValue = (member.role || '').trim();
      console.log('Adding member with role:', JSON.stringify(roleValue));
      if (!allowedRoles.includes(roleValue)) {
        roleValue = 'Other';
        console.log('Role not allowed, defaulting to:', roleValue);
      }
      const { data, error } = await supabase
        .from('family_members')
        .insert([
          {
            family_id: familyId,
            name: member.name,
            initial: member.initial,
            role: roleValue,
            color: member.color,
            nickname: member.nickname || null,
            dob: member.dob || null,
            points: member.points || 0,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        ...member,
        role: roleValue,
        points: data.points || 0
      };
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }

  async updateFamilyMember(member: FamilyMember): Promise<void> {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({
          name: member.name,
          initial: member.initial,
          role: member.role,
          color: member.color,
          nickname: member.nickname,
          dob: member.dob,
          points: member.points
        })
        .eq('id', member.id);
      if (error) throw error;
      console.log('✅ Family member updated in Supabase');
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
  }

  async deleteFamilyMember(id: number): Promise<void> {
    try {
      console.log('[deleteFamilyMember] Deleting family member with ID:', id);
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log('[deleteFamilyMember] Successfully deleted family member');
    } catch (error) {
      console.error('Error deleting family member:', error);
      throw error;
    }
  }

  async getChores(): Promise<Chore[]> {
    const familyId = this.ensureFamilyContext();
    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('family_id', familyId);
      if (error) throw error;
      
      // Get family members to convert IDs back to names
      const familyMembers = await this.getFamilyMembers();
      
      return (data || []).map((row: any) => {
        // Convert assigned_to_id back to name
        let assignedTo: string[] = [];
        if (row.assigned_to_id) {
          const member = familyMembers.find(m => m.id === row.assigned_to_id);
          if (member) {
            assignedTo = [member.name];
          }
        }
        
        return {
          id: String(row.id),
          title: row.title,
          assignedTo: assignedTo,
          completed: row.status === 'completed',
          points: row.points,
          dueDate: row.due_date,
          icon: row.icon,
          choreTypeId: row.chore_type_id ? String(row.chore_type_id) : null
        };
      });
    } catch (error) {
      console.error('Error getting chores:', error);
      return [];
    }
  }

  async addChore(chore: NewChore): Promise<Chore> {
    const familyId = this.ensureFamilyContext();
    try {
      console.log('[addChore] Adding new chore:', chore);
      
      // Convert assigned member name to ID if provided
      let assignedToId = null;
      if (chore.assignedTo && Array.isArray(chore.assignedTo) && chore.assignedTo.length > 0) {
        const familyMembers = await this.getFamilyMembers();
        const member = familyMembers.find(m => m.name === chore.assignedTo[0]);
        assignedToId = member ? member.id : null;
      } else if (chore.assignedTo && typeof chore.assignedTo === 'string') {
        const familyMembers = await this.getFamilyMembers();
        const member = familyMembers.find(m => m.name === chore.assignedTo);
        assignedToId = member ? member.id : null;
      }

      const { data, error } = await supabase
        .from('chores')
        .insert([
          {
            family_id: familyId,
            title: chore.title,
            assigned_to_id: assignedToId,
            status: chore.completed ? 'completed' : 'pending',
            points: chore.points,
            due_date: chore.dueDate,
            icon: chore.icon,
            chore_type_id: chore.choreTypeId,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      
      console.log('[addChore] Successfully added chore:', data);
      return {
        id: String(data.id),
        title: data.title,
        assignedTo: chore.assignedTo, // Keep original format for UI
        completed: data.status === 'completed',
        points: data.points,
        dueDate: data.due_date,
        icon: data.icon,
        choreTypeId: data.chore_type_id ? String(data.chore_type_id) : null
      };
    } catch (error) {
      console.error('Error adding chore:', error);
      throw error;
    }
  }

  async updateChore(chore: Chore): Promise<void> {
    try {
      console.log('[updateChore] Updating chore:', chore);
      
      // Convert assigned member name to ID if provided
      let assignedToId = null;
      if (chore.assignedTo && Array.isArray(chore.assignedTo) && chore.assignedTo.length > 0) {
        const familyMembers = await this.getFamilyMembers();
        const member = familyMembers.find(m => m.name === chore.assignedTo[0]);
        assignedToId = member ? member.id : null;
      }

      const { error } = await supabase
        .from('chores')
        .update({
          title: chore.title,
          assigned_to_id: assignedToId,
          status: chore.completed ? 'completed' : 'pending',
          points: chore.points,
          due_date: chore.dueDate,
          icon: chore.icon,
          chore_type_id: chore.choreTypeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', chore.id);
      if (error) throw error;
      console.log('[updateChore] Successfully updated chore');
    } catch (error) {
      console.error('Error updating chore:', error);
      throw error;
    }
  }

  async deleteChore(id: number): Promise<void> {
    try {
      console.log('[deleteChore] Deleting chore with ID:', id);
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log('[deleteChore] Successfully deleted chore');
    } catch (error) {
      console.error('Error deleting chore:', error);
      throw error;
    }
  }

  async getChoreTypes(): Promise<ChoreType[]> {
    try {
      const { data, error } = await supabase
        .from('chore_types')
        .select('*');
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name,
        defaultPoints: row.default_points,
        icon: row.icon
      }));
    } catch (error) {
      console.error('Error getting chore types:', error);
      return [];
    }
  }

  async updateChoreTypes(choreTypes: ChoreType[]): Promise<ChoreType[]> {
    const familyId = this.ensureFamilyContext();
    try {
      console.log('[updateChoreTypes] Updating chore types:', choreTypes);
      
      // For simplicity, we'll delete existing and insert new ones (like SQLite version)
      // In production, you might want a more sophisticated merge strategy
      const { error: deleteError } = await supabase
        .from('chore_types')
        .delete()
        .eq('family_id', familyId);
      if (deleteError) throw deleteError;
      
      // Insert new chore types
      if (choreTypes.length > 0) {
        const insertData = choreTypes.map(choreType => ({
          family_id: familyId,
          name: choreType.name,
          default_points: choreType.defaultPoints,
          icon: choreType.icon,
          created_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('chore_types')
          .insert(insertData);
        if (insertError) throw insertError;
      }
      
      // Return the updated list
      return this.getChoreTypes();
    } catch (error) {
      console.error('Error updating chore types:', error);
      throw error;
    }
  }

  async getEvents(): Promise<EventItem[]> {
    const familyId = this.ensureFamilyContext();
    console.log('[getEvents] Using familyId:', familyId);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('family_id', familyId)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      console.log('[getEvents] Raw data from Supabase:', data);
      
      // Get family members to convert IDs back to names
      const familyMembers = await this.getFamilyMembers();
      
      return (data || []).map((row: any) => {
        // Convert attendee IDs back to names
        const attendeeNames = (row.attendee_ids || [])
          .map((id: string) => {
            const member = familyMembers.find(m => m.id === id);
            return member ? member.name : null;
          })
          .filter((name: string | null) => name !== null);
          
        return {
          id: String(row.id),
          title: row.title,
          startTime: row.start_time,
          endTime: row.end_time,
          time: `${row.start_time} - ${row.end_time}`,
          day: row.day_of_week,
          color: row.color,
          attendees: attendeeNames
        };
      });
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async addEvent(event: Omit<EventItem, 'id'>): Promise<EventItem> {
    const familyId = this.ensureFamilyContext();
    try {
      console.log('[addEvent] Received event data:', event);
      
      // Convert member names to UUIDs if needed
      let attendeeIds: string[] = [];
      if (event.attendees && event.attendees.length > 0) {
        // Get family members to map names to IDs
        const familyMembers = await this.getFamilyMembers();
        attendeeIds = event.attendees
          .map(name => {
            const member = familyMembers.find(m => m.name === name);
            return member ? member.id : null;
          })
          .filter(id => id !== null) as string[];
        console.log('[addEvent] Converted attendees to IDs:', { names: event.attendees, ids: attendeeIds });
      }

      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            family_id: familyId,
            title: event.title,
            start_time: event.startTime,
            end_time: event.endTime,
            day_of_week: event.day,
            color: event.color,
            attendee_ids: attendeeIds,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      
      return {
        id: String(data.id),
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        day: data.day_of_week,
        color: event.color,
        attendees: event.attendees || [], // Keep original names for UI
        time: `${event.startTime} - ${event.endTime}`
      };
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }

  async updateEvent(event: EventItem): Promise<void> {
    try {
      console.log('[updateEvent] Updating event:', event);
      
      // Convert member names to UUIDs if needed
      let attendeeIds: string[] = [];
      if (event.attendees && event.attendees.length > 0) {
        const familyMembers = await this.getFamilyMembers();
        attendeeIds = event.attendees
          .map(name => {
            const member = familyMembers.find(m => m.name === name);
            return member ? member.id : null;
          })
          .filter(id => id !== null) as string[];
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: event.title,
          start_time: event.startTime,
          end_time: event.endTime,
          day_of_week: event.day,
          color: event.color,
          attendee_ids: attendeeIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);
      if (error) throw error;
      console.log('[updateEvent] Successfully updated event');
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    try {
      console.log('[deleteEvent] Deleting event with ID:', id);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log('[deleteEvent] Successfully deleted event');
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getRewards(): Promise<Reward[]> {
    const familyId = this.ensureFamilyContext();
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('family_id', familyId);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: String(row.id),
        title: row.title,
        cost: row.cost,
        icon: row.icon,
        available: !!row.available
      }));
    } catch (error) {
      console.error('Error getting rewards:', error);
      return [];
    }
  }

  async addReward(reward: NewReward): Promise<Reward> {
    const familyId = this.ensureFamilyContext();
    try {
      console.log('[addReward] Adding new reward:', reward);
      const { data, error } = await supabase
        .from('rewards')
        .insert([
          {
            family_id: familyId,
            title: reward.title,
            cost: reward.cost,
            icon: reward.icon || 'gift',
            available: true,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      
      console.log('[addReward] Successfully added reward:', data);
      return {
        id: String(data.id),
        title: data.title,
        cost: data.cost,
        icon: data.icon,
        available: data.available
      };
    } catch (error) {
      console.error('Error adding reward:', error);
      throw error;
    }
  }

  async updateReward(reward: Reward): Promise<void> {
    try {
      console.log('[updateReward] Updating reward:', reward);
      const { error } = await supabase
        .from('rewards')
        .update({
          title: reward.title,
          cost: reward.cost,
          icon: reward.icon,
          available: reward.available
        })
        .eq('id', reward.id);
      if (error) throw error;
      console.log('[updateReward] Successfully updated reward');
    } catch (error) {
      console.error('Error updating reward:', error);
      throw error;
    }
  }

  async deleteReward(id: number): Promise<void> {
    try {
      console.log('[deleteReward] Deleting reward with ID:', id);
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log('[deleteReward] Successfully deleted reward');
    } catch (error) {
      console.error('Error deleting reward:', error);
      throw error;
    }
  }

  async getRoutines(): Promise<Routine[]> {
    const familyId = this.ensureFamilyContext();
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('family_id', familyId);
      if (error) throw error;
      
      // Get family members to convert IDs back to names
      const familyMembers = await this.getFamilyMembers();
      
      return (data || []).map((row: any) => {
        // Convert applies_to_member_ids back to names or keep as IDs based on what UI expects
        let appliesToMemberIds: string[] = [];
        if (row.applies_to_member_ids && row.applies_to_member_ids.length > 0) {
          appliesToMemberIds = row.applies_to_member_ids
            .map((id: string) => {
              const member = familyMembers.find(m => m.id === id);
              return member ? member.name : id; // Return name if found, otherwise return ID
            })
            .filter((item: string) => item !== null);
        }
        
        return {
          id: String(row.id),
          name: row.name,
          appliesToMemberIds: appliesToMemberIds,
          steps: row.steps ? JSON.parse(row.steps) : [],
          completionPoints: row.completion_points
        };
      });
    } catch (error) {
      console.error('Error getting routines:', error);
      return [];
    }
  }

  async addRoutine(routine: Omit<Routine, 'id'>): Promise<Routine> {
    const familyId = this.ensureFamilyContext();
    try {
      console.log('[addRoutine] Adding new routine:', routine);
      
      // Convert member names to UUIDs if needed
      let memberIds: string[] = [];
      if (routine.appliesToMemberIds && routine.appliesToMemberIds.length > 0) {
        const familyMembers = await this.getFamilyMembers();
        // Check if we have names or IDs
        const firstItem = routine.appliesToMemberIds[0];
        if (typeof firstItem === 'string' && !firstItem.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // Looks like names, convert to IDs
          memberIds = routine.appliesToMemberIds
            .map(name => {
              const member = familyMembers.find(m => m.name === name);
              return member ? member.id : null;
            })
            .filter(id => id !== null) as string[];
        } else {
          // Already IDs
          memberIds = routine.appliesToMemberIds;
        }
      }

      const { data, error } = await supabase
        .from('routines')
        .insert([
          {
            family_id: familyId,
            name: routine.name,
            applies_to_member_ids: memberIds,
            steps: JSON.stringify(routine.steps),
            completion_points: routine.completionPoints,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      
      console.log('[addRoutine] Successfully added routine:', data);
      return {
        id: String(data.id),
        name: data.name,
        appliesToMemberIds: routine.appliesToMemberIds, // Keep original format for UI
        steps: routine.steps,
        completionPoints: data.completion_points
      };
    } catch (error) {
      console.error('Error adding routine:', error);
      throw error;
    }
  }

  async updateRoutines(routines: Routine[]): Promise<Routine[]> {
    const familyId = this.ensureFamilyContext();
    try {
      console.log('[updateRoutines] Updating routines:', routines);
      
      // Delete existing routines for this family
      const { error: deleteError } = await supabase
        .from('routines')
        .delete()
        .eq('family_id', familyId);
      if (deleteError) throw deleteError;
      
      // Insert new routines
      if (routines.length > 0) {
        const familyMembers = await this.getFamilyMembers();
        
        const insertData = routines.map(routine => {
          // Convert member names to UUIDs if needed
          let memberIds: string[] = [];
          if (routine.appliesToMemberIds && routine.appliesToMemberIds.length > 0) {
            const firstItem = routine.appliesToMemberIds[0];
            if (typeof firstItem === 'string' && !firstItem.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              // Convert names to IDs
              memberIds = routine.appliesToMemberIds
                .map(name => {
                  const member = familyMembers.find(m => m.name === name);
                  return member ? member.id : null;
                })
                .filter(id => id !== null) as string[];
            } else {
              memberIds = routine.appliesToMemberIds;
            }
          }
          
          return {
            family_id: familyId,
            name: routine.name,
            applies_to_member_ids: memberIds,
            steps: JSON.stringify(routine.steps),
            completion_points: routine.completionPoints,
            created_at: new Date().toISOString()
          };
        });
        
        const { error: insertError } = await supabase
          .from('routines')
          .insert(insertData);
        if (insertError) throw insertError;
      }
      
      // Return the updated list
      return this.getRoutines();
    } catch (error) {
      console.error('Error updating routines:', error);
      throw error;
    }
  }

  async deleteRoutine(id: string): Promise<void> {
    try {
      console.log('[deleteRoutine] Deleting routine with ID:', id);
      
      // Delete associated progress records first
      const { error: progressError } = await supabase
        .from('daily_routine_progress')
        .delete()
        .eq('routine_id', id);
      if (progressError) console.warn('Warning deleting routine progress:', progressError);
      
      // Delete the routine
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      console.log('[deleteRoutine] Successfully deleted routine');
    } catch (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
  }

  async getDailyRoutineProgress(date: string): Promise<DailyRoutineProgress[]> {
    const familyId = this.ensureFamilyContext();
    try {
      // Join with family_members to filter by family_id since progress table doesn't have family_id directly
      const { data, error } = await supabase
        .from('daily_routine_progress')
        .select(`
          *,
          family_members!inner (
            id,
            name,
            family_id
          )
        `)
        .eq('family_members.family_id', familyId)
        .eq('date', date);
      if (error) throw error;
      
      return (data || []).map((row: any) => {
        return {
          memberId: row.family_members.name, // Use member name for UI
          routineId: row.routine_id,
          date: row.date,
          completedStepIds: row.completed_step_ids || [], // Should already be an array from TEXT[]
          isFullyCompleted: !!row.is_fully_completed
        };
      });
    } catch (error) {
      console.error('Error getting daily routine progress:', error);
      return [];
    }
  }

  async upsertDailyRoutineProgress(progress: DailyRoutineProgress): Promise<void> {
    this.ensureInitialized(); // Just ensure service is initialized, don't need family context for insert
    try {
      console.log('[upsertDailyRoutineProgress] Upserting progress:', progress);
      
      // Convert member name to ID if needed
      let memberId = progress.memberId;
      if (typeof memberId === 'string' && !memberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Looks like a name, convert to ID
        const familyMembers = await this.getFamilyMembers();
        const member = familyMembers.find(m => m.name === memberId);
        if (member) {
          memberId = member.id;
        } else {
          throw new Error(`Member not found: ${memberId}`);
        }
      }
      
      // Use Supabase's upsert functionality
      const { error } = await supabase
        .from('daily_routine_progress')
        .upsert([
          {
            member_id: memberId,
            routine_id: progress.routineId,
            date: progress.date,
            completed_step_ids: progress.completedStepIds, // Keep as array, Supabase should handle TEXT[] properly
            is_fully_completed: progress.isFullyCompleted,
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'member_id,routine_id,date' // Handle unique constraint
        });
      
      if (error) throw error;
      console.log('[upsertDailyRoutineProgress] Successfully upserted progress');
    } catch (error) {
      console.error('Error upserting daily routine progress:', error);
      throw error;
    }
  }

  async saveActiveTab(tabId: TabId): Promise<void> {
    const familyId = this.ensureFamilyContext();
    try {
      const { error } = await supabase
        .from('families')
        .update({ active_tab: tabId })
        .eq('id', familyId);
      if (error) throw error;
      console.log('✅ Active tab saved to Supabase:', tabId);
    } catch (error) {
      console.error('Error saving active tab:', error);
      throw error;
    }
  }

  async getActiveTab(): Promise<TabId | null> {
    const familyId = this.ensureFamilyContext();
    try {
      const { data, error } = await supabase
        .from('families')
        .select('active_tab')
        .eq('id', familyId)
        .single();
      if (error) throw error;
      return data && data.active_tab ? data.active_tab as TabId : null;
    } catch (error) {
      console.error('Error getting active tab:', error);
      return null;
    }
  }

  async getServiceInfo(): Promise<{ type: 'supabase'; version: string; status: 'active' }> {
    return {
      type: 'supabase',
      version: '1.0.0',
      status: 'active'
    };
  }

  // Method to create a new family
  async createNewFamily(familyName: string, familyAddress?: string): Promise<{ id: string, name: string, address?: string } | null> {
    this.ensureInitialized(); // Ensure service itself is initialized

    try {
      const userResult = await supabaseService.getCurrentUser();
      if (!userResult || !userResult.user || !userResult.user.id) {
        console.error('❌ Cannot create family: User not authenticated with Supabase or user ID is missing.');
        throw new Error('User not authenticated or user ID missing, cannot create family.');
      }

      const user = userResult.user;
      console.log(`➕ Creating new family "${familyName}" for user ${user.id}`);

      // Insert new family into 'families' table, linking to the user
      // Adjust columns based on your actual 'families' table schema
      const { data, error } = await supabaseService.query(
        `INSERT INTO families (name, address, created_by_user_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, address`,
        [familyName, familyAddress || null, user.id]
      );

      if (error) {
        console.error('❌ Error creating new family in Supabase:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const newFamily = data[0];
        this.currentFamilyId = newFamily.id; // Set context to the new family
        console.log(`✅ New family created with ID: ${newFamily.id}, Name: ${newFamily.name}`);
        return { id: newFamily.id, name: newFamily.name, address: newFamily.address };
      } else {
        console.error('❌ Family creation did not return expected data.');
        return null;
      }
    } catch (error) {
      console.error('Error in createNewFamily:', error);
      throw error; // Re-throw to be caught by caller
    }
  }

  // Method to join an existing family using invite code
  async joinFamilyWithInviteCode(inviteCode: string): Promise<{ id: string, name: string, address?: string } | null> {
    this.ensureInitialized();

    try {
      const userResult = await supabaseService.getCurrentUser();
      if (!userResult || !userResult.user || !userResult.user.id) {
        throw new Error('User not authenticated, cannot join family.');
      }

      console.log(`🔍 Looking for family with invite code: ${inviteCode}`);

      // Use the proper RPC function that bypasses RLS issues
      const joinResult = await supabaseService.joinFamilyByInvite(inviteCode, 'child');
      
      if (!joinResult.success) {
        console.error('❌ Failed to join family:', joinResult.error);
        throw new Error(joinResult.error || 'Failed to join family. Please check the invite code and try again.');
      }

      const familyData = joinResult.family;
      if (!familyData) {
        throw new Error('Family data not returned after successful join.');
      }

      console.log(`👨‍👩‍👧‍👦 Successfully joined family: ${familyData.name}`);
      
      // Set current family ID for this service instance
      this.currentFamilyId = familyData.id;
      
      return {
        id: familyData.id,
        name: familyData.name,
        address: familyData.address
      };
    } catch (error) {
      console.error('Error in joinFamilyWithInviteCode:', error);
      throw error;
    }
  }

  // Add this method to allow setting the current family context externally
  setCurrentFamilyId(familyId: string) {
    this.currentFamilyId = familyId;
  }
}

console.log('📦 SupabaseDataService loaded');
