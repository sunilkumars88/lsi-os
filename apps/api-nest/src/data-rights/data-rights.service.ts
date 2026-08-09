import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DATA_RIGHTS_ZONES, DataRightsZone } from './data-rights.registry';

type ReviewRequest = {
  id: string;
  orgId: string;
  zoneId: string;
  requester: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

@Injectable()
export class DataRightsService {
  private reviews: ReviewRequest[] = [];

  zones(): DataRightsZone[] {
    return DATA_RIGHTS_ZONES;
  }

  registry() {
    return {
      zones: DATA_RIGHTS_ZONES,
      frameworks: ['GDPR', 'DPDP', 'SOC2'],
      rights: ['access', 'rectification', 'erasure', 'portability', 'restrict'],
    };
  }

  getZone(id: string) {
    const zone = DATA_RIGHTS_ZONES.find((z) => z.id === id);
    if (!zone) throw new NotFoundException('Zone not found');
    return zone;
  }

  listReviews(orgId: string) {
    return this.reviews.filter((r) => r.orgId === orgId);
  }

  requestReview(
    orgId: string,
    zoneId: string,
    requester: string,
    reason: string,
  ) {
    this.getZone(zoneId);
    const review: ReviewRequest = {
      id: uuidv4(),
      orgId,
      zoneId,
      requester,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.reviews.unshift(review);
    return review;
  }
}
