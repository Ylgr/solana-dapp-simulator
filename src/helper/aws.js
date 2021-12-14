import { basename } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
async function uploadFile(
    s3Client,
    awsS3Bucket,
    filename,
    contentType,
    body,
) {
    const mediaUploadParams = {
        Bucket: awsS3Bucket,
        Key: filename,
        Body: body,
        ACL: 'public-read',
        ContentType: contentType,
    };

    try {
        await s3Client.send(new PutObjectCommand(mediaUploadParams));
        console.log('uploaded filename:', filename);
    } catch (err) {
        console.error('Error', err);
    }

    const url = `https://${awsS3Bucket}.s3.amazonaws.com/${filename}`;
    console.log('Location:', url);
    return url;
}

export async function awsUpload(
    awsS3Bucket,
    file,
    manifestBuffer,
    image
) {
    console.log('image: ', image)
    console.log('image: ', typeof image)
    const s3Client = new S3Client({
        region: localStorage.getItem('region'),
        credentials: {
            accessKeyId: localStorage.getItem('accessKeyId'),
            secretAccessKey: localStorage.getItem('secretAccessKey'),
        }
    });

    const filename = `assets/${basename(file)}`;
    console.log('file:', file);
    console.log('filename:', filename);

    const fileExtension = filename.split('.').pop()

    const mediaUrl = await uploadFile(
        s3Client,
        awsS3Bucket,
        filename,
        image.type,
        image,
    );

    // Copied from ipfsUpload
    const manifestJson = JSON.parse(manifestBuffer.toString('utf8'));
    manifestJson.image = mediaUrl;
    manifestJson.properties.files = manifestJson.properties.files.map(f => {
        return { ...f, uri: mediaUrl };
    });
    const updatedManifestBuffer = Buffer.from(JSON.stringify(manifestJson));

    const metadataFilename = filename.replace(fileExtension, 'json');
    const metadataUrl = await uploadFile(
        s3Client,
        awsS3Bucket,
        metadataFilename,
        'application/json',
        updatedManifestBuffer,
    );
    console.log(metadataUrl)
    return metadataUrl;
}
