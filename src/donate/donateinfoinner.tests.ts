import * as assert from 'assert';
import {DonateInfoInner} from './donateinfoinner';


suite('DonateInfoInner', () => {

	/**
	 * Mock class to control the time for the unit tests.
	 */
	class MockDonateInfo extends DonateInfoInner {
		public static time: number;
		public static previousVersion: string;
		public static currentVersion: string;
		public static donationTime: number | undefined;
		public static donated: boolean;
		public static showInfoMessageReturn: string;
		public static showInfoMessageCalled: boolean;	// Out
		public static openDonateWebViewCalled: boolean;	// Out

		protected static now(): number {
			return this.time;
		}
		protected static getPreviousVersion(): string {
			return this.previousVersion;
		}
		protected static getCurrentVersion(): string {
			return this.currentVersion;
		}
		protected static getDonationTime(): number | undefined {
			return this.donationTime;
		}
		protected static setDonationTime(time: number | undefined) {
			this.donationTime = time;
		}
		protected static getDonatedPref(): boolean {
			return this.donated;
		}
		public static daysInMs(days: number): number {
			return super.daysInMs(days);
		}
		public static async showInfoMessage(message: string, ...items: string[]): Promise<string> {
			this.showInfoMessageCalled = true;
			return this.showInfoMessageReturn;
		}
		public static openDonateWebView() {
			this.openDonateWebViewCalled = true;
		}
	}


	test('daysInMs', () => {
		assert.equal(MockDonateInfo.daysInMs(0), 0);
		assert.equal(MockDonateInfo.daysInMs(1), 24 * 60 * 60 * 1000);
		assert.equal(MockDonateInfo.daysInMs(14), 14 * 24 * 60 * 60 * 1000);
	});

	test('donatedPreferencesChanged', () => {
		MockDonateInfo.donated = false;
		MockDonateInfo.time = 12;
		(MockDonateInfo as any).evaluateDonateTime = 23;
		MockDonateInfo.donatedPreferencesChanged();
		assert.equal((MockDonateInfo as any).evaluateDonateTime, 12);

		MockDonateInfo.donated = true;
		MockDonateInfo.time = 22;
		(MockDonateInfo as any).evaluateDonateTime = 33;
		MockDonateInfo.donatedPreferencesChanged();
		assert.equal((MockDonateInfo as any).evaluateDonateTime, undefined);
	});


	test('checkVersion', () => {
		MockDonateInfo.previousVersion = "1.0.0";
		MockDonateInfo.currentVersion = "1.0.0";
		MockDonateInfo.donationTime = 41;
		MockDonateInfo.checkVersion();
		assert.equal(MockDonateInfo.donationTime, 41);	// Unchanged

		MockDonateInfo.previousVersion = "1.0.0";
		MockDonateInfo.currentVersion = "1.0.1";
		MockDonateInfo.donationTime = 41;
		MockDonateInfo.checkVersion();
		assert.equal(MockDonateInfo.donationTime, undefined);	// Reset
	});


	suite('checkDonateInfo', () => {

		test('not enabled', async () => {
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.openDonateWebViewCalled = false;
			MockDonateInfo.time = 17;
			MockDonateInfo.donationTime = 51;
			(MockDonateInfo as any).evaluateDonateTime = undefined;
			await MockDonateInfo.checkDonateInfo();
			assert.equal(MockDonateInfo.donationTime, 51);	// Unchanged
			assert.equal((MockDonateInfo as any).evaluateDonateTime, undefined);	// Unchanged
			assert.equal(MockDonateInfo.showInfoMessageCalled, false);	// Not called
			assert.equal(MockDonateInfo.openDonateWebViewCalled, false);	// Not called

			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.openDonateWebViewCalled = false;
			MockDonateInfo.time = 17;
			MockDonateInfo.donationTime = 51;
			(MockDonateInfo as any).evaluateDonateTime = 62;	// > time
			await MockDonateInfo.checkDonateInfo();
			assert.equal(MockDonateInfo.donationTime, 51);	// Unchanged
			assert.equal((MockDonateInfo as any).evaluateDonateTime, 62);	// Unchanged
			assert.equal(MockDonateInfo.showInfoMessageCalled, false);	// Not called
			assert.equal(MockDonateInfo.openDonateWebViewCalled, false);	// Not called
		});


		test('set time', async () => {
			// donateEndTime is set
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = 51;
			await MockDonateInfo.checkDonateInfo();
			assert.ok((MockDonateInfo as any).donateEndTime > 17);	// Is set

			// donateEndTime is unchanged
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = 25;
			MockDonateInfo.donationTime = 51;
			await MockDonateInfo.checkDonateInfo();
			assert.equal((MockDonateInfo as any).donateEndTime, 25);	// Unchanged
		});



		test('showInfoMessage', async () => {
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = 51;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(MockDonateInfo.showInfoMessageCalled);	// Is called
			assert.ok((MockDonateInfo as any).evaluateDonateTime != undefined);

			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = 15;	// < time
			MockDonateInfo.donationTime = 51;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(!MockDonateInfo.showInfoMessageCalled);	// Is not called
			assert.equal((MockDonateInfo as any).evaluateDonateTime, undefined);	// Reset
		});


		test('openDonateWebView', async () => {
			// User answers: no
			MockDonateInfo.showInfoMessageReturn = 'no';
			MockDonateInfo.openDonateWebViewCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = 51;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(!MockDonateInfo.openDonateWebViewCalled);	// Is not called

			// User answers: yes
			MockDonateInfo.showInfoMessageReturn = 'yes,something';
			MockDonateInfo.openDonateWebViewCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = 51;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(MockDonateInfo.openDonateWebViewCalled);	// Is called
		});

		test('several calls', async () => {
			// First, info message is shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = 51;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(MockDonateInfo.showInfoMessageCalled);	// Is called

			// Then the next time it is not shown
			MockDonateInfo.showInfoMessageCalled = false;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(!MockDonateInfo.showInfoMessageCalled);	// Is not called

			// And again not shown
			MockDonateInfo.showInfoMessageCalled = false;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(!MockDonateInfo.showInfoMessageCalled);	// Is not called
		});


		test('again not before another day', async () => {
			const oneDay = 1 * 24 * 60 * 60 * 1000;
			const twoWeeks = 14 * 24 * 60 * 60 * 1000;

			// First, info message is shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = undefined;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(MockDonateInfo.showInfoMessageCalled);	// Is called
			assert.equal((MockDonateInfo as any).evaluateDonateTime, 18 + oneDay);
			assert.equal((MockDonateInfo as any).donateEndTime, 18 + twoWeeks);

			// Not yet a day: nothing shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time += oneDay / 2;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(!MockDonateInfo.showInfoMessageCalled);	// Is not called
			assert.ok((MockDonateInfo as any).evaluateDonateTime != undefined);

			// Now a day is over and it is again shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time += oneDay / 2;
			await MockDonateInfo.checkDonateInfo();
			assert.equal((MockDonateInfo as any).evaluateDonateTime, 18 + 2 * oneDay);
			assert.ok(MockDonateInfo.showInfoMessageCalled);	// Is called
		});


		test('after 1, 2 weeks', async () => {
			const twoWeeks = 14 * 24 * 60 * 60 * 1000;

			// First, info message is shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = undefined;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(MockDonateInfo.showInfoMessageCalled);	// Is called

			// 1 week later: info message is shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time += twoWeeks / 2;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(MockDonateInfo.showInfoMessageCalled);	// Is called

			// 2 weeks later: nothing is shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time += twoWeeks / 2;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(!MockDonateInfo.showInfoMessageCalled);	// Is not called
		});

		test('after 2 weeks (without intermediate)', async () => {
			const twoWeeks = 14 * 24 * 60 * 60 * 1000;

			// First, info message is shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time = 18;
			(MockDonateInfo as any).evaluateDonateTime = 17;	// < time
			(MockDonateInfo as any).donateEndTime = undefined;
			MockDonateInfo.donationTime = undefined;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(MockDonateInfo.showInfoMessageCalled);	// Is called

			// 2 weeks later: nothing is shown
			MockDonateInfo.showInfoMessageCalled = false;
			MockDonateInfo.time += twoWeeks;
			await MockDonateInfo.checkDonateInfo();
			assert.ok(!MockDonateInfo.showInfoMessageCalled);	// Is not called
		});

	});

});