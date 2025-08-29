import { supabase } from '../config/supabase.js'
import fs from 'fs'
import path from 'path'

export const uploadToSupabase = async (filePath, fileName, folder = 'pdfs') => {
  console.log('🚀 Starting Supabase upload for file:', filePath)
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${fileName}`
    const storagePath = `${folder}/${uniqueFileName}`
    
    console.log('📤 Uploading to Supabase path:', storagePath)
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(error.message)
    }
    
    console.log('✅ Supabase upload successful:', data.path)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath)
    
    return {
      success: true,
      url: urlData.publicUrl,
      fileName: uniqueFileName,
      storagePath: storagePath,
      bucket: 'documents'
    }
  } catch (error) {
    console.error('❌ Supabase upload error:', error.message)
    return { success: false, error: error.message }
  }
}

export const downloadFromSupabase = async (storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath)
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('❌ Supabase download error:', error.message)
    return { success: false, error: error.message }
  }
}

export const deleteFromSupabase = async (storagePath) => {
  try {
    const { error } = await supabase.storage
      .from('documents')
      .remove([storagePath])
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('❌ Supabase delete error:', error.message)
    return { success: false, error: error.message }
  }
}

export const getSupabaseFileInfo = async (storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .list(path.dirname(storagePath))
    
    if (error) throw error
    
    const file = data.find(f => f.name === path.basename(storagePath))
    return { success: true, file }
  } catch (error) {
    console.error('❌ Supabase file info error:', error.message)
    return { success: false, error: error.message }
  }
}

export const streamFromSupabase = async (storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath)
    
    if (error) throw error
    
    return { success: true, stream: data }
  } catch (error) {
    console.error('❌ Supabase stream error:', error.message)
    return { success: false, error: error.message }
  }
}

export const getSupabasePublicUrl = (storagePath) => {
  try {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath)
    
    return { success: true, url: data.publicUrl }
  } catch (error) {
    console.error('❌ Supabase public URL error:', error.message)
    return { success: false, error: error.message }
  }
}

