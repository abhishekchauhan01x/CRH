# Supabase Storage Setup for PDFs

## Overview
This system uses a hybrid storage approach:
- **PDFs** → Supabase Storage
- **Images/Videos** → Cloudinary

## Environment Variables Required
Add these to your `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Storage Setup

### 1. Create Storage Bucket
1. Go to your Supabase dashboard
2. Navigate to Storage → Buckets
3. Create a new bucket called `documents`
4. Set it to public (or configure policies)

### 2. Storage Policies
For the `documents` bucket, add these policies:

#### Policy 1: Allow authenticated users to upload PDFs
```sql
CREATE POLICY "Allow authenticated users to upload PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text = 'pdf'
);
```

#### Policy 2: Allow public read access to PDFs
```sql
CREATE POLICY "Allow public read access to PDFs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents'
);
```

#### Policy 3: Allow authenticated users to delete their PDFs
```sql
CREATE POLICY "Allow authenticated users to delete PDFs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

### 3. File Structure
PDFs will be stored in the following structure:
```
documents/
├── pdfs/
│   ├── timestamp_filename1.pdf
│   ├── timestamp_filename2.pdf
│   └── ...
```

## How It Works

### Upload Process
1. **PDF Detection**: System checks file extension
2. **Supabase Upload**: PDFs are uploaded to Supabase Storage
3. **Metadata Storage**: Document info stored in MongoDB with `storage_type: 'supabase'`

### Viewing Process
1. **PDF Proxy**: Uses `/api/user/pdf-proxy/:file_id` endpoint
2. **Streaming**: PDFs are streamed from Supabase to the browser
3. **Security**: Only authenticated users can access their own documents

## Testing
1. Upload a PDF file through the appointment system
2. Check Supabase Storage dashboard for the file
3. Use "View Documents" button to see uploaded files
4. Click "View PDF" to open the PDF in a new tab

## Troubleshooting

### Common Issues
1. **Environment Variables**: Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
2. **Bucket Permissions**: Check that the `documents` bucket exists and is public
3. **Storage Policies**: Verify the policies allow upload/read/delete operations
4. **File Size**: Ensure PDFs are within reasonable size limits

### Debug Logs
Check the backend console for:
- `🚀 Supabase initialized`
- `📄 PDF detected - using Supabase Storage`
- `✅ PDF uploaded to Supabase successfully`

