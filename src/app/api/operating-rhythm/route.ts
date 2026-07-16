import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all rhythm items for workspace
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace_id from query params
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Verify user has access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch rhythm items
    const { data: items, error: itemsError } = await supabase
      .from('operating_rhythm_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching rhythm items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch rhythm items' }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new rhythm item
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, category, title, frequency } = body;

    // Validate required fields
    if (!workspace_id || !category || !title || !frequency) {
      return NextResponse.json({ 
        error: 'Missing required fields: workspace_id, category, title, frequency' 
      }, { status: 400 });
    }

    // Validate category and frequency
    const validCategories = ['daily', 'weekly', 'monthly'];
    if (!validCategories.includes(category) || !validCategories.includes(frequency)) {
      return NextResponse.json({ 
        error: 'Invalid category or frequency. Must be: daily, weekly, or monthly' 
      }, { status: 400 });
    }

    // Verify user has access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create rhythm item
    const { data: item, error: createError } = await supabase
      .from('operating_rhythm_items')
      .insert({
        workspace_id,
        user_id: user.id,
        category,
        title,
        frequency,
        completed: false
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating rhythm item:', createError);
      return NextResponse.json({ error: 'Failed to create rhythm item' }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update completion status
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, completed, title, category, frequency } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (completed !== undefined) updates.completed = completed;
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (frequency !== undefined) updates.frequency = frequency;

    // Update rhythm item (RLS will enforce ownership)
    const { data: item, error: updateError } = await supabase
      .from('operating_rhythm_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 });
      }
      console.error('Error updating rhythm item:', updateError);
      return NextResponse.json({ error: 'Failed to update rhythm item' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove item
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Delete rhythm item (RLS will enforce ownership)
    const { error: deleteError } = await supabase
      .from('operating_rhythm_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 });
      }
      console.error('Error deleting rhythm item:', deleteError);
      return NextResponse.json({ error: 'Failed to delete rhythm item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}