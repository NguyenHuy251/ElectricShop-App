import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveApiImages} from '../utils/api-images.ts';

test('uploaded images resolve to the backend host reachable from the device',()=>{
  const response={data:[{hinh_anh:'/uploads/test.png',images:[{duong_dan:'/uploads/gallery.webp'}],gia_ban:1000}]};
  const actual=resolveApiImages(response,'http://192.168.1.8:3000/api');
  assert.equal(actual.data[0].hinh_anh,'http://192.168.1.8:3000/uploads/test.png');
  assert.equal(actual.data[0].images[0].duong_dan,'http://192.168.1.8:3000/uploads/gallery.webp');
  assert.equal(response.data[0].hinh_anh,'/uploads/test.png');
});
test('remote images, null and numeric data are preserved',()=>{
  assert.deepEqual(resolveApiImages({image:'https://cdn.example.com/image.jpg',empty:null,price:1999},'http://localhost:3000/api'),{image:'https://cdn.example.com/image.jpg',empty:null,price:1999});
});
